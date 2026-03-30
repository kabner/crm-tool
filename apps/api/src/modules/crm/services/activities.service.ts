import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { ActivityFilterDto } from '../dto/activity-filter.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateActivityDto,
  ): Promise<Activity> {
    const activity = this.activityRepo.create({
      ...dto,
      tenantId,
      userId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      metadata: dto.metadata ?? {},
    });
    return this.activityRepo.save(activity);
  }

  async findAll(
    tenantId: string,
    filters: ActivityFilterDto,
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.tenantId = :tenantId', { tenantId });

    this.applyFilters(qb, filters);

    const sort = filters.sort ?? 'createdAt';
    const order = filters.order ?? 'DESC';
    qb.orderBy(`activity.${sort}`, order);

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findByContact(
    tenantId: string,
    contactId: string,
    filters: ActivityFilterDto,
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    return this.findAll(tenantId, { ...filters, contactId });
  }

  async findByCompany(
    tenantId: string,
    companyId: string,
    filters: ActivityFilterDto,
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    return this.findAll(tenantId, { ...filters, companyId });
  }

  async findByDeal(
    tenantId: string,
    dealId: string,
    filters: ActivityFilterDto,
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    return this.findAll(tenantId, { ...filters, dealId });
  }

  async findOne(tenantId: string, id: string): Promise<Activity> {
    const activity = await this.activityRepo.findOne({
      where: { id, tenantId },
      relations: ['user'],
    });
    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }
    return activity;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateActivityDto,
  ): Promise<Activity> {
    const activity = await this.findOne(tenantId, id);

    const { dueDate, completedAt, ...rest } = dto;
    const updateData: Partial<Activity> = { ...rest } as Partial<Activity>;
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }
    if (completedAt) {
      updateData.completedAt = new Date(completedAt);
    }

    Object.assign(activity, updateData);
    return this.activityRepo.save(activity);
  }

  async complete(tenantId: string, id: string): Promise<Activity> {
    const activity = await this.findOne(tenantId, id);
    activity.completedAt = new Date();
    return this.activityRepo.save(activity);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const activity = await this.findOne(tenantId, id);
    await this.activityRepo.remove(activity);
  }

  async getUpcomingTasks(
    tenantId: string,
    userId: string,
    limit = 10,
  ): Promise<Activity[]> {
    return this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.tenantId = :tenantId', { tenantId })
      .andWhere('activity.userId = :userId', { userId })
      .andWhere('activity.type = :type', { type: 'task' })
      .andWhere('activity.completedAt IS NULL')
      .andWhere('activity.dueDate IS NOT NULL')
      .orderBy('activity.dueDate', 'ASC')
      .take(limit)
      .getMany();
  }

  private applyFilters(
    qb: SelectQueryBuilder<Activity>,
    filters: ActivityFilterDto,
  ): void {
    if (filters.type) {
      qb.andWhere('activity.type = :type', { type: filters.type });
    }
    if (filters.contactId) {
      qb.andWhere('activity.contactId = :contactId', {
        contactId: filters.contactId,
      });
    }
    if (filters.companyId) {
      qb.andWhere('activity.companyId = :companyId', {
        companyId: filters.companyId,
      });
    }
    if (filters.dealId) {
      qb.andWhere('activity.dealId = :dealId', { dealId: filters.dealId });
    }
    if (filters.userId) {
      qb.andWhere('activity.userId = :userId', { userId: filters.userId });
    }
    if (filters.completed !== undefined) {
      if (filters.completed) {
        qb.andWhere('activity.completedAt IS NOT NULL');
      } else {
        qb.andWhere('activity.completedAt IS NULL');
      }
    }
    if (filters.dueBefore) {
      qb.andWhere('activity.dueDate <= :dueBefore', {
        dueBefore: new Date(filters.dueBefore),
      });
    }
    if (filters.dueAfter) {
      qb.andWhere('activity.dueDate >= :dueAfter', {
        dueAfter: new Date(filters.dueAfter),
      });
    }
  }
}
