import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { ContactCompany } from '../entities/contact-company.entity';
import { Activity } from '../entities/activity.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactFilterDto } from '../dto/contact-filter.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ContactCompany)
    private readonly contactCompanyRepository: Repository<ContactCompany>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
  ) {}

  async create(tenantId: string, dto: CreateContactDto, userId?: string): Promise<Contact> {
    const { companyIds, ...contactData } = dto;

    const contact = this.contactRepository.create({
      ...contactData,
      tenantId,
      createdById: userId,
    });

    const savedContact = await this.contactRepository.save(contact);

    // Auto-create ContactCompany association if companyId provided
    if (dto.companyId) {
      const existing = await this.contactCompanyRepository.findOne({
        where: { contactId: savedContact.id, companyId: dto.companyId },
      });
      if (!existing) {
        const association = this.contactCompanyRepository.create({
          contactId: savedContact.id,
          companyId: dto.companyId,
          isPrimary: true,
        });
        await this.contactCompanyRepository.save(association);
      }
    }

    if (companyIds?.length) {
      const associations = companyIds
        .filter((cId) => cId !== dto.companyId) // avoid duplicate if already added above
        .map((companyId, index) =>
          this.contactCompanyRepository.create({
            contactId: savedContact.id,
            companyId,
            isPrimary: !dto.companyId && index === 0,
          }),
        );
      if (associations.length) {
        await this.contactCompanyRepository.save(associations);
      }
    }

    return this.findOne(tenantId, savedContact.id);
  }

  async findAll(
    tenantId: string,
    filters: ContactFilterDto,
    userId?: string,
  ): Promise<{
    data: Contact[];
    meta: { total: number; totalCount: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      sort,
      order = 'DESC',
      search,
      favorite,
      leadStatus,
      ownerId,
      tags,
      companyId,
      createdAfter,
      createdBefore,
    } = filters;

    // Total unfiltered count for this tenant
    const totalCount = await this.contactRepository.count({
      where: { tenantId },
    });

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.company', 'comp')
      .leftJoin('contact.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.firstName', 'createdBy.lastName'])
      .where('contact.tenantId = :tenantId', { tenantId });

    // Full-text search across name, email, phone, company name, deal name (Task 3 + Task 8)
    if (search) {
      const trimmed = search.trim();
      const parts = trimmed.split(/\s+/);

      // Left join deals via company for search expansion
      qb.leftJoin('comp.children', 'searchDummy'); // ensure comp already joined
      qb.leftJoin('deals', 'deal', 'deal.company_id = comp.id');

      if (parts.length >= 2) {
        qb.andWhere(
          '((contact.firstName ILIKE :first AND contact.lastName ILIKE :last) OR contact.email ILIKE :search OR contact.phone ILIKE :search OR comp.name ILIKE :search OR deal.name ILIKE :search)',
          { first: `%${parts[0]}%`, last: `%${parts.slice(1).join(' ')}%`, search: `%${trimmed}%` },
        );
      } else {
        qb.andWhere(
          '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search OR contact.phone ILIKE :search OR comp.name ILIKE :search OR deal.name ILIKE :search)',
          { search: `%${trimmed}%` },
        );
      }
      // Ensure we don't get duplicates from joins
      qb.distinct(true);
    }

    if (leadStatus) {
      qb.andWhere('contact.leadStatus = :leadStatus', { leadStatus });
    }

    if (filters.contactType) {
      qb.andWhere('contact.contactType = :contactType', { contactType: filters.contactType });
    }

    if (ownerId) {
      qb.andWhere('contact.ownerId = :ownerId', { ownerId });
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      qb.andWhere('contact.tags && :tags', { tags: tagList });
    }

    if (companyId) {
      qb.innerJoin(
        ContactCompany,
        'cc',
        'cc.contactId = contact.id AND cc.companyId = :companyId',
        { companyId },
      );
    }

    if (createdAfter) {
      qb.andWhere('contact.createdAt >= :createdAfter', { createdAfter });
    }

    if (createdBefore) {
      qb.andWhere('contact.createdAt <= :createdBefore', { createdBefore });
    }

    // Visibility filter: show records visible to everyone, or where user is creator/owner
    if (userId) {
      qb.andWhere(
        '(contact.visibility = :visEveryone OR contact.createdById = :visUserId OR contact.ownerId = :visUserId)',
        { visEveryone: 'everyone', visUserId: userId },
      );
    }

    // Favorite filter
    if (favorite === 'true' && userId) {
      qb.innerJoin(
        UserFavorite,
        'fav',
        'fav.entityId = contact.id AND fav.entityType = :favType AND fav.userId = :favUserId',
        { favType: 'contact', favUserId: userId },
      );
    }

    // Sorting
    const sortField = sort ? `contact.${sort}` : 'contact.createdAt';
    qb.orderBy(sortField, order);

    // Pagination
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string): Promise<Contact> {
    const contact = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.company', 'comp')
      .leftJoin('contact.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.firstName', 'createdBy.lastName'])
      .leftJoinAndMapMany(
        'contact.companies',
        ContactCompany,
        'cc',
        'cc.contactId = contact.id',
      )
      .where('contact.id = :id', { id })
      .andWhere('contact.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    return contact;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateContactDto,
  ): Promise<Contact> {
    const contact = await this.findOne(tenantId, id);

    const { companyIds, ...updateData } = dto;

    Object.assign(contact, updateData);
    await this.contactRepository.save(contact);

    if (companyIds !== undefined) {
      // Remove existing associations
      await this.contactCompanyRepository.delete({ contactId: id });

      // Create new associations
      if (companyIds.length) {
        const associations = companyIds.map((companyId, index) =>
          this.contactCompanyRepository.create({
            contactId: id,
            companyId,
            isPrimary: index === 0,
          }),
        );
        await this.contactCompanyRepository.save(associations);
      }
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const contact = await this.findOne(tenantId, id);
    await this.contactCompanyRepository.delete({ contactId: contact.id });
    await this.contactRepository.remove(contact);
  }

  async bulkUpdate(
    tenantId: string,
    ids: string[],
    dto: Partial<UpdateContactDto>,
  ): Promise<number> {
    const { companyIds, ...updateData } = dto;

    const result = await this.contactRepository
      .createQueryBuilder()
      .update(Contact)
      .set(updateData)
      .where('id IN (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId })
      .execute();

    return result.affected ?? 0;
  }

  async bulkDelete(tenantId: string, ids: string[]): Promise<number> {
    // Remove company associations first
    await this.contactCompanyRepository
      .createQueryBuilder()
      .delete()
      .where('contactId IN (:...ids)', { ids })
      .execute();

    const result = await this.contactRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId })
      .execute();

    return result.affected ?? 0;
  }

  async findDuplicates(tenantId: string) {
    const pairs: { id1: string; id2: string; match_type: string }[] =
      await this.contactRepository.query(
        `SELECT c1.id as id1, c2.id as id2,
          CASE WHEN c1.email IS NOT NULL AND c1.email = c2.email THEN 'email' ELSE 'name' END as match_type
        FROM contacts c1
        JOIN contacts c2 ON c1.tenant_id = c2.tenant_id
          AND c1.id < c2.id
          AND (
            (c1.email IS NOT NULL AND c1.email = c2.email)
            OR (c1.first_name = c2.first_name AND c1.last_name = c2.last_name)
          )
        WHERE c1.tenant_id = $1
        LIMIT 50`,
        [tenantId],
      );

    const allIds = new Set<string>();
    pairs.forEach((p) => {
      allIds.add(p.id1);
      allIds.add(p.id2);
    });

    if (allIds.size === 0) {
      return { pairs: [] };
    }

    const contacts = await this.contactRepository.find({
      where: { id: In([...allIds]), tenantId },
    });
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    return {
      pairs: pairs
        .filter((p) => contactMap.has(p.id1) && contactMap.has(p.id2))
        .map((p) => ({
          contact1: contactMap.get(p.id1),
          contact2: contactMap.get(p.id2),
          matchType: p.match_type,
        })),
    };
  }

  async merge(
    tenantId: string,
    keepId: string,
    mergeId: string,
  ): Promise<Contact> {
    const keep = await this.findOne(tenantId, keepId);
    const merge = await this.findOne(tenantId, mergeId);

    // Fill empty fields on keep from merge
    const fillableFields: (keyof Contact)[] = [
      'email',
      'phone',
      'jobTitle',
      'leadStatus',
      'ownerId',
      'source',
      'contactType',
      'companyId',
    ];
    for (const field of fillableFields) {
      if (!keep[field] && merge[field]) {
        (keep as any)[field] = merge[field];
      }
    }

    // Merge tags
    if (merge.tags?.length) {
      const tagSet = new Set([...(keep.tags || []), ...merge.tags]);
      keep.tags = [...tagSet];
    }

    // Merge customProps
    if (merge.customProps) {
      keep.customProps = { ...merge.customProps, ...keep.customProps };
    }

    await this.contactRepository.save(keep);

    // Move activities from merge to keep
    await this.activityRepository
      .createQueryBuilder()
      .update(Activity)
      .set({ contactId: keepId })
      .where('contactId = :mergeId', { mergeId })
      .execute();

    // Move contact_companies from merge to keep (avoid duplicates)
    const mergeAssociations = await this.contactCompanyRepository.find({
      where: { contactId: mergeId },
    });
    const keepAssociations = await this.contactCompanyRepository.find({
      where: { contactId: keepId },
    });
    const keepCompanyIds = new Set(keepAssociations.map((a) => a.companyId));

    for (const assoc of mergeAssociations) {
      if (!keepCompanyIds.has(assoc.companyId)) {
        assoc.contactId = keepId;
        await this.contactCompanyRepository.save(assoc);
      }
    }

    // Delete remaining merge associations and the merge contact
    await this.contactCompanyRepository.delete({ contactId: mergeId });
    await this.contactRepository.remove(merge);

    return this.findOne(tenantId, keepId);
  }
}
