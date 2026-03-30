import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { List } from '../entities/list.entity';
import { ListMembership } from '../entities/list-membership.entity';
import { Contact } from '../entities/contact.entity';
import { CreateListDto } from '../dto/create-list.dto';
import { UpdateListDto } from '../dto/update-list.dto';
import { ListFilterDto } from '../dto/list-filter.dto';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List)
    private readonly listRepository: Repository<List>,
    @InjectRepository(ListMembership)
    private readonly membershipRepository: Repository<ListMembership>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateListDto,
  ): Promise<List & { memberCount: number }> {
    const list = this.listRepository.create({
      ...dto,
      tenantId,
      createdBy: userId,
    });

    const savedList = await this.listRepository.save(list);
    return { ...savedList, memberCount: 0 };
  }

  async findAll(
    tenantId: string,
    filters: ListFilterDto,
  ): Promise<{
    data: (List & { memberCount: number })[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20, sort, order = 'DESC', type, search } = filters;

    const qb = this.listRepository
      .createQueryBuilder('list')
      .leftJoin(
        ListMembership,
        'membership',
        'membership.listId = list.id',
      )
      .addSelect('COUNT(membership.id)', 'memberCount')
      .where('list.tenantId = :tenantId', { tenantId })
      .groupBy('list.id');

    if (type) {
      qb.andWhere('list.type = :type', { type });
    }

    if (search) {
      qb.andWhere('list.name ILIKE :search', { search: `%${search}%` });
    }

    const sortField = sort ? `list.${sort}` : 'list.createdAt';
    qb.orderBy(sortField, order);

    const skip = (page - 1) * limit;

    // Get total count
    const totalQb = qb.clone();
    const totalRaw = await totalQb.select('list.id').getRawMany();
    const total = totalRaw.length;

    // Get paginated results
    qb.offset(skip).limit(limit);
    const rawResults = await qb.getRawAndEntities();

    const data = rawResults.entities.map((entity, index) => ({
      ...entity,
      memberCount: parseInt(rawResults.raw[index]?.memberCount ?? '0', 10),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<List & { memberCount: number }> {
    const result = await this.listRepository
      .createQueryBuilder('list')
      .leftJoin(
        ListMembership,
        'membership',
        'membership.listId = list.id',
      )
      .addSelect('COUNT(membership.id)', 'memberCount')
      .where('list.id = :id', { id })
      .andWhere('list.tenantId = :tenantId', { tenantId })
      .groupBy('list.id')
      .getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException(`List with ID "${id}" not found`);
    }

    const list = result.entities[0];
    const memberCount = parseInt(result.raw[0]?.memberCount ?? '0', 10);

    return { ...list, memberCount } as List & { memberCount: number };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateListDto,
  ): Promise<List & { memberCount: number }> {
    const existing = await this.findOne(tenantId, id);

    // Don't allow changing the type
    if (dto.type && dto.type !== existing.type) {
      throw new BadRequestException('Cannot change the type of an existing list');
    }

    Object.assign(existing, dto);
    await this.listRepository.save(existing);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const list = await this.findOne(tenantId, id);
    await this.membershipRepository.delete({ listId: list.id });
    await this.listRepository.remove(list);
  }

  async getMembers(
    tenantId: string,
    listId: string,
    pagination: PaginationQueryDto,
  ): Promise<{
    data: Contact[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const list = await this.findOne(tenantId, listId);
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    if (list.type === 'smart') {
      return this.executeSmartListQuery(tenantId, list.filters, page, limit);
    }

    // Static list: query via list_memberships join
    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .innerJoin(
        ListMembership,
        'membership',
        'membership.contactId = contact.id AND membership.listId = :listId',
        { listId },
      )
      .where('contact.tenantId = :tenantId', { tenantId })
      .orderBy('membership.addedAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addMembers(
    tenantId: string,
    listId: string,
    contactIds: string[],
  ): Promise<{ added: number }> {
    const list = await this.findOne(tenantId, listId);

    if (list.type !== 'static') {
      throw new BadRequestException(
        'Can only manually add members to static lists',
      );
    }

    // Verify contacts belong to the same tenant
    const contacts = await this.contactRepository.find({
      where: { id: In(contactIds), tenantId },
      select: ['id'],
    });

    const validIds = contacts.map((c) => c.id);

    // Filter out already-existing memberships
    const existing = await this.membershipRepository.find({
      where: { listId, contactId: In(validIds) },
      select: ['contactId'],
    });
    const existingSet = new Set(existing.map((m) => m.contactId));

    const newIds = validIds.filter((id) => !existingSet.has(id));

    if (newIds.length > 0) {
      const memberships = newIds.map((contactId) =>
        this.membershipRepository.create({
          listId,
          contactId,
          source: 'manual',
        }),
      );
      await this.membershipRepository.save(memberships);
    }

    return { added: newIds.length };
  }

  async removeMembers(
    tenantId: string,
    listId: string,
    contactIds: string[],
  ): Promise<{ removed: number }> {
    const list = await this.findOne(tenantId, listId);

    if (list.type !== 'static') {
      throw new BadRequestException(
        'Can only manually remove members from static lists',
      );
    }

    const result = await this.membershipRepository
      .createQueryBuilder()
      .delete()
      .where('listId = :listId', { listId })
      .andWhere('contactId IN (:...contactIds)', { contactIds })
      .execute();

    return { removed: result.affected ?? 0 };
  }

  async evaluateSmartList(
    tenantId: string,
    filters: Record<string, any>,
  ): Promise<{ count: number }> {
    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    this.applySmartFilters(qb, filters);

    const count = await qb.getCount();
    return { count };
  }

  // --- Private helpers ---

  private async executeSmartListQuery(
    tenantId: string,
    filters: Record<string, any>,
    page: number,
    limit: number,
  ): Promise<{
    data: Contact[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    this.applySmartFilters(qb, filters);

    qb.orderBy('contact.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private applySmartFilters(
    qb: ReturnType<Repository<Contact>['createQueryBuilder']>,
    filters: Record<string, any>,
  ): void {
    if (!filters || !filters.conditions || !Array.isArray(filters.conditions)) {
      return;
    }

    const logicalOperator: 'AND' | 'OR' = filters.operator === 'OR' ? 'OR' : 'AND';

    filters.conditions.forEach(
      (
        condition: { field: string; operator: string; value?: any },
        index: number,
      ) => {
        const paramName = `filter_${index}`;
        const clause = this.buildConditionClause(
          condition.field,
          condition.operator,
          condition.value,
          paramName,
        );

        if (!clause) return;

        if (index === 0 || logicalOperator === 'AND') {
          qb.andWhere(clause.sql, clause.params);
        } else {
          qb.orWhere(clause.sql, clause.params);
        }
      },
    );
  }

  private buildConditionClause(
    field: string,
    operator: string,
    value: any,
    paramName: string,
  ): { sql: string; params: Record<string, any> } | null {
    // Map field names to column references
    const columnMap: Record<string, string> = {
      firstName: 'contact.firstName',
      lastName: 'contact.lastName',
      email: 'contact.email',
      phone: 'contact.phone',
      jobTitle: 'contact.jobTitle',
      lifecycleStage: 'contact.lifecycleStage',
      leadStatus: 'contact.leadStatus',
      tags: 'contact.tags',
      source: 'contact.source',
      createdAt: 'contact.createdAt',
      updatedAt: 'contact.updatedAt',
      lastActivityAt: 'contact.lastActivityAt',
      ownerId: 'contact.ownerId',
    };

    const column = columnMap[field];
    if (!column) return null;

    switch (operator) {
      case 'equals':
        return {
          sql: `${column} = :${paramName}`,
          params: { [paramName]: value },
        };
      case 'not_equals':
        return {
          sql: `${column} != :${paramName}`,
          params: { [paramName]: value },
        };
      case 'contains':
        // For array fields (tags), use array overlap
        if (field === 'tags') {
          return {
            sql: `${column} @> ARRAY[:${paramName}]::text[]`,
            params: { [paramName]: value },
          };
        }
        return {
          sql: `${column} ILIKE :${paramName}`,
          params: { [paramName]: `%${value}%` },
        };
      case 'not_contains':
        if (field === 'tags') {
          return {
            sql: `NOT (${column} @> ARRAY[:${paramName}]::text[])`,
            params: { [paramName]: value },
          };
        }
        return {
          sql: `${column} NOT ILIKE :${paramName}`,
          params: { [paramName]: `%${value}%` },
        };
      case 'starts_with':
        return {
          sql: `${column} ILIKE :${paramName}`,
          params: { [paramName]: `${value}%` },
        };
      case 'greater_than':
        return {
          sql: `${column} > :${paramName}`,
          params: { [paramName]: value },
        };
      case 'less_than':
        return {
          sql: `${column} < :${paramName}`,
          params: { [paramName]: value },
        };
      case 'after':
        return {
          sql: `${column} > :${paramName}`,
          params: { [paramName]: new Date(value) },
        };
      case 'before':
        return {
          sql: `${column} < :${paramName}`,
          params: { [paramName]: new Date(value) },
        };
      case 'is_empty':
        return {
          sql: `(${column} IS NULL OR ${column} = '')`,
          params: {},
        };
      case 'is_not_empty':
        return {
          sql: `(${column} IS NOT NULL AND ${column} != '')`,
          params: {},
        };
      default:
        return null;
    }
  }
}
