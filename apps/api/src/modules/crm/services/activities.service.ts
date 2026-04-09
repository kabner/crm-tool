import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { Deal } from '../entities/deal.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../../../shared/notifications/entities/notification.entity';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { ActivityFilterDto } from '../dto/activity-filter.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
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
      recurrenceEndDate: dto.recurrenceEndDate
        ? new Date(dto.recurrenceEndDate)
        : undefined,
      metadata: dto.metadata ?? {},
    });
    const savedActivity = await this.activityRepo.save(activity);

    if (savedActivity.dealId) {
      await this.dealRepository.update(
        { id: savedActivity.dealId, tenantId },
        { lastActivityAt: new Date() },
      );
    }

    // Process @mentions asynchronously (fire-and-forget)
    this.processMentions(savedActivity).catch((err) =>
      this.logger.error('Failed to process mentions', err),
    );

    return savedActivity;
  }

  private async processMentions(activity: Activity): Promise<void> {
    if (!activity.body) return;

    const mentionRegex = /@(\w+(?:\.\w+)?)/g;
    const mentions = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(activity.body)) !== null) {
      mentions.add(match[1]!.toLowerCase());
    }

    if (mentions.size === 0) return;

    const tenantUsers = await this.userRepository.find({
      where: { tenantId: activity.tenantId, status: 'active' },
      select: ['id', 'firstName', 'lastName'],
    });

    const actionUrl = activity.contactId
      ? `/contacts/${activity.contactId}`
      : activity.companyId
        ? `/companies/${activity.companyId}`
        : activity.dealId
          ? `/deals/${activity.dealId}`
          : null;

    const matchedUserIds = new Set<string>();

    for (const mention of mentions) {
      for (const user of tenantUsers) {
        if (user.id === activity.userId) continue; // don't notify yourself
        const fullName = `${user.firstName}.${user.lastName}`.toLowerCase();
        const first = user.firstName.toLowerCase();

        if (mention === fullName || mention === first) {
          matchedUserIds.add(user.id);
        }
      }
    }

    const notifications = Array.from(matchedUserIds).map((userId) =>
      this.notificationRepository.create({
        tenantId: activity.tenantId,
        userId,
        type: 'mention',
        title: 'You were mentioned in a note',
        body: activity.subject,
        actionUrl,
        resourceType: 'activity',
        resourceId: activity.id,
        actorId: activity.userId,
      }),
    );

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }

  async findAll(
    tenantId: string,
    filters: ActivityFilterDto,
  ): Promise<{ data: Activity[]; total: number; page: number; limit: number }> {
    const qb = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .leftJoinAndSelect('activity.children', 'children')
      .where('activity.tenantId = :tenantId', { tenantId })
      .andWhere('activity.parentId IS NULL');

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
    const saved = await this.activityRepo.save(activity);

    if (saved.recurrenceRule && saved.type === 'task') {
      await this.createNextRecurrence(saved);
    }

    return saved;
  }

  private async createNextRecurrence(activity: Activity): Promise<void> {
    const nextDueDate = this.calculateNextDueDate(
      activity.dueDate,
      activity.recurrenceRule,
    );

    if (
      activity.recurrenceEndDate &&
      nextDueDate > new Date(activity.recurrenceEndDate)
    ) {
      return;
    }

    const next = this.activityRepo.create({
      tenantId: activity.tenantId,
      type: 'task',
      subject: activity.subject,
      body: activity.body,
      contactId: activity.contactId,
      companyId: activity.companyId,
      dealId: activity.dealId,
      userId: activity.userId,
      dueDate: nextDueDate,
      recurrenceRule: activity.recurrenceRule,
      recurrenceEndDate: activity.recurrenceEndDate,
      recurringSourceId: activity.recurringSourceId || activity.id,
      metadata: activity.metadata,
    });
    await this.activityRepo.save(next);
  }

  private calculateNextDueDate(
    currentDueDate: Date | null,
    rule: string,
  ): Date {
    const base = currentDueDate ? new Date(currentDueDate) : new Date();
    switch (rule) {
      case 'daily':
        base.setDate(base.getDate() + 1);
        break;
      case 'weekly':
        base.setDate(base.getDate() + 7);
        break;
      case 'monthly':
        base.setMonth(base.getMonth() + 1);
        break;
      case 'yearly':
        base.setFullYear(base.getFullYear() + 1);
        break;
    }
    return base;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const activity = await this.findOne(tenantId, id);
    await this.activityRepo.remove(activity);
  }

  async findSubtasks(
    tenantId: string,
    parentId: string,
  ): Promise<Activity[]> {
    return this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.user', 'user')
      .where('activity.tenantId = :tenantId', { tenantId })
      .andWhere('activity.parentId = :parentId', { parentId })
      .orderBy('activity.createdAt', 'ASC')
      .getMany();
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
