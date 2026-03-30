import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(data: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create(data);
    return this.notificationRepo.save(notification);
  }

  async notify(
    tenantId: string,
    userId: string,
    type: string,
    title: string,
    body: string,
    options?: {
      actionUrl?: string;
      resourceType?: string;
      resourceId?: string;
      actorId?: string;
    },
  ): Promise<Notification> {
    return this.create({
      tenantId,
      userId,
      type,
      title,
      body,
      ...options,
    });
  }

  async findForUser(
    tenantId: string,
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number; offset?: number },
  ): Promise<{ data: Notification[]; unreadCount: number }> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const where: any = { tenantId, userId };
    if (options?.unreadOnly) {
      where.readAt = IsNull();
    }

    const [data, unreadCount] = await Promise.all([
      this.notificationRepo.find({
        where,
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      }),
      this.getUnreadCount(tenantId, userId),
    ]);

    return { data, unreadCount };
  }

  async markAsRead(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<void> {
    await this.notificationRepo.update(
      { id: notificationId, tenantId, userId },
      { readAt: new Date() },
    );
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await this.notificationRepo.update(
      { tenantId, userId, readAt: IsNull() },
      { readAt: new Date() },
    );
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { tenantId, userId, readAt: IsNull() },
    });
  }

  async deleteOld(tenantId: string, olderThan: Date): Promise<number> {
    const result = await this.notificationRepo.delete({
      tenantId,
      createdAt: LessThan(olderThan),
    });
    return result.affected ?? 0;
  }
}
