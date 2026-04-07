import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { FeedReaction } from '../entities/feed-reaction.entity';
import { Notification } from '../../../shared/notifications/entities/notification.entity';

export interface ReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface FeedItem {
  id: string;
  feedType: 'activity' | 'notification';
  type: string;
  title: string;
  body: string | null;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string } | null;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  dueDate?: Date;
  completedAt?: Date;
  actionUrl?: string;
  readAt?: Date;
  reactions: ReactionSummary[];
}

export interface FeedOptions {
  mode: 'all' | 'mine';
  page: number;
  limit: number;
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(FeedReaction)
    private readonly reactionRepo: Repository<FeedReaction>,
  ) {}

  async getFeed(
    tenantId: string,
    userId: string,
    options: FeedOptions,
  ): Promise<{
    data: FeedItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { mode, page, limit } = options;

    // Fetch activities
    const activityWhere: Record<string, string> =
      mode === 'mine'
        ? { tenantId, userId }
        : { tenantId };

    const activities = await this.activityRepo.find({
      where: activityWhere,
      relations: ['user', 'contact', 'company', 'deal'],
      order: { createdAt: 'DESC' },
    });

    // Fetch notifications
    const notificationWhere: Record<string, string> =
      mode === 'mine'
        ? { tenantId, userId }
        : { tenantId };

    const notifications = await this.notificationRepo.find({
      where: notificationWhere,
      order: { createdAt: 'DESC' },
    });

    // Build merged feed items
    const activityItems: FeedItem[] = activities.map((a) => ({
      id: a.id,
      feedType: 'activity' as const,
      type: a.type,
      title: a.subject,
      body: a.body || null,
      createdAt: a.createdAt,
      user: a.user
        ? { id: a.user.id, firstName: a.user.firstName, lastName: a.user.lastName }
        : null,
      contactId: a.contactId || undefined,
      companyId: a.companyId || undefined,
      dealId: a.dealId || undefined,
      dueDate: a.dueDate || undefined,
      completedAt: a.completedAt || undefined,
      reactions: [],
    }));

    const notificationItems: FeedItem[] = notifications.map((n) => ({
      id: n.id,
      feedType: 'notification' as const,
      type: n.type,
      title: n.title,
      body: n.body || null,
      createdAt: n.createdAt,
      user: null,
      actionUrl: n.actionUrl || undefined,
      readAt: n.readAt || undefined,
      reactions: [],
    }));

    // Merge and sort
    const merged = [...activityItems, ...notificationItems].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = merged.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = merged.slice(start, start + limit);

    // Attach reactions for paginated items
    if (paginated.length > 0) {
      const entityIds = paginated.map((item) => item.id);
      const reactions = await this.reactionRepo
        .createQueryBuilder('r')
        .where('r.entity_id IN (:...entityIds)', { entityIds })
        .getMany();

      const reactionMap = new Map<string, FeedReaction[]>();
      for (const reaction of reactions) {
        const key = `${reaction.entityType}:${reaction.entityId}`;
        if (!reactionMap.has(key)) reactionMap.set(key, []);
        reactionMap.get(key)!.push(reaction);
      }

      for (const item of paginated) {
        const key = `${item.feedType}:${item.id}`;
        const itemReactions = reactionMap.get(key) || [];
        item.reactions = this.summarizeReactions(itemReactions, userId);
      }
    }

    return {
      data: paginated,
      meta: { total, page, limit, totalPages },
    };
  }

  async getReactions(
    entityType: string,
    entityId: string,
  ): Promise<ReactionSummary[]> {
    const reactions = await this.reactionRepo.find({
      where: { entityType, entityId },
    });
    // Return without user-specific "reacted" since we don't have userId context here
    return this.summarizeReactions(reactions, '');
  }

  async toggleReaction(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
    emoji: string,
  ): Promise<ReactionSummary[]> {
    const existing = await this.reactionRepo.findOne({
      where: { userId, entityType, entityId, emoji },
    });

    if (existing) {
      await this.reactionRepo.remove(existing);
    } else {
      const reaction = this.reactionRepo.create({
        tenantId,
        userId,
        entityType,
        entityId,
        emoji,
      });
      await this.reactionRepo.save(reaction);
    }

    // Return updated reaction list
    const reactions = await this.reactionRepo.find({
      where: { entityType, entityId },
    });
    return this.summarizeReactions(reactions, userId);
  }

  private summarizeReactions(
    reactions: FeedReaction[],
    userId: string,
  ): ReactionSummary[] {
    const emojiMap = new Map<string, { count: number; reacted: boolean }>();
    for (const r of reactions) {
      const existing = emojiMap.get(r.emoji) || { count: 0, reacted: false };
      existing.count++;
      if (r.userId === userId) existing.reacted = true;
      emojiMap.set(r.emoji, existing);
    }
    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      reacted: data.reacted,
    }));
  }
}
