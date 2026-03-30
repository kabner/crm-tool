import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionItem } from '../entities/subscription-item.entity';
import { Price } from '../entities/price.entity';
import { MRRMovement } from '../entities/mrr-movement.entity';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionItem)
    private readonly subscriptionItemRepository: Repository<SubscriptionItem>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(MRRMovement)
    private readonly mrrMovementRepository: Repository<MRRMovement>,
  ) {}

  private async calculateMRR(items: { priceId: string; quantity: number }[]): Promise<number> {
    let mrr = 0;
    for (const item of items) {
      const price = await this.priceRepository.findOne({ where: { id: item.priceId } });
      if (!price || price.type !== 'recurring') continue;

      let monthlyAmount = price.amount * item.quantity;
      if (price.interval === 'year') {
        monthlyAmount = Math.round(monthlyAmount / 12);
      } else if (price.interval === 'week') {
        monthlyAmount = Math.round(monthlyAmount * 4.33);
      } else if (price.interval === 'day') {
        monthlyAmount = Math.round(monthlyAmount * 30);
      }
      // month is default — no conversion needed
      mrr += monthlyAmount;
    }
    return mrr;
  }

  async create(
    tenantId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription & { items: SubscriptionItem[] }> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = this.subscriptionRepository.create({
      tenantId,
      contactId: dto.contactId,
      companyId: dto.companyId ?? undefined,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    const items = dto.items.map((item) =>
      this.subscriptionItemRepository.create({
        subscriptionId: savedSubscription.id,
        productId: item.productId,
        priceId: item.priceId,
        quantity: item.quantity ?? 1,
      }),
    );
    const savedItems = await this.subscriptionItemRepository.save(items);

    // Record MRR movement
    const mrr = await this.calculateMRR(
      dto.items.map((i) => ({ priceId: i.priceId, quantity: i.quantity ?? 1 })),
    );
    if (mrr > 0) {
      await this.mrrMovementRepository.save(
        this.mrrMovementRepository.create({
          tenantId,
          subscriptionId: savedSubscription.id,
          type: 'new',
          amount: mrr,
          effectiveDate: now,
        }),
      );
    }

    return { ...savedSubscription, items: savedItems };
  }

  async findAll(
    tenantId: string,
    filters: { page?: number; limit?: number; status?: string },
  ): Promise<{
    data: (Subscription & { items: SubscriptionItem[] })[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20, status } = filters;

    const qb = this.subscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndMapMany(
        'sub.items',
        SubscriptionItem,
        'si',
        'si.subscriptionId = sub.id',
      )
      .where('sub.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('sub.status = :status', { status });
    }

    qb.orderBy('sub.createdAt', 'DESC');

    const skip = (page - 1) * limit;

    // Count without join
    const countQb = this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.tenantId = :tenantId', { tenantId });
    if (status) {
      countQb.andWhere('sub.status = :status', { status });
    }
    const total = await countQb.getCount();

    qb.skip(skip).take(limit);
    const data = await qb.getMany();

    return {
      data: data as (Subscription & { items: SubscriptionItem[] })[],
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
  ): Promise<Subscription & { items: SubscriptionItem[] }> {
    const subscription = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndMapMany(
        'sub.items',
        SubscriptionItem,
        'si',
        'si.subscriptionId = sub.id',
      )
      .where('sub.id = :id', { id })
      .andWhere('sub.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    return subscription as Subscription & { items: SubscriptionItem[] };
  }

  async cancel(
    tenantId: string,
    id: string,
    immediately: boolean,
  ): Promise<Subscription> {
    const subscription = await this.findOne(tenantId, id);

    if (subscription.status === 'canceled') {
      throw new BadRequestException('Subscription is already canceled');
    }

    if (immediately) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    const saved = await this.subscriptionRepository.save(subscription);

    // Record churn MRR movement
    const items = subscription.items ?? [];
    const mrr = await this.calculateMRR(
      items.map((i) => ({ priceId: i.priceId, quantity: i.quantity })),
    );
    if (mrr > 0) {
      await this.mrrMovementRepository.save(
        this.mrrMovementRepository.create({
          tenantId,
          subscriptionId: id,
          type: 'churn',
          amount: -mrr,
          effectiveDate: new Date(),
        }),
      );
    }

    return saved;
  }

  async pause(tenantId: string, id: string): Promise<Subscription> {
    const subscription = await this.findOne(tenantId, id);

    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    subscription.status = 'paused';
    subscription.pauseStartedAt = new Date();

    return this.subscriptionRepository.save(subscription);
  }

  async resume(tenantId: string, id: string): Promise<Subscription> {
    const subscription = await this.findOne(tenantId, id);

    if (subscription.status !== 'paused') {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    subscription.status = 'active';
    subscription.pauseStartedAt = null;

    return this.subscriptionRepository.save(subscription);
  }

  async changePlan(
    tenantId: string,
    id: string,
    newItems: { productId: string; priceId: string; quantity?: number }[],
  ): Promise<Subscription & { items: SubscriptionItem[] }> {
    const subscription = await this.findOne(tenantId, id);

    if (subscription.status !== 'active') {
      throw new BadRequestException('Only active subscriptions can change plan');
    }

    // Calculate old MRR
    const oldItems = subscription.items ?? [];
    const oldMRR = await this.calculateMRR(
      oldItems.map((i) => ({ priceId: i.priceId, quantity: i.quantity })),
    );

    // Remove old items
    await this.subscriptionItemRepository
      .createQueryBuilder()
      .delete()
      .where('subscriptionId = :subscriptionId', { subscriptionId: id })
      .execute();

    // Create new items
    const items = newItems.map((item) =>
      this.subscriptionItemRepository.create({
        subscriptionId: id,
        productId: item.productId,
        priceId: item.priceId,
        quantity: item.quantity ?? 1,
      }),
    );
    await this.subscriptionItemRepository.save(items);

    // Calculate new MRR and record movement
    const newMRR = await this.calculateMRR(
      newItems.map((i) => ({ priceId: i.priceId, quantity: i.quantity ?? 1 })),
    );

    const diff = newMRR - oldMRR;
    if (diff !== 0) {
      await this.mrrMovementRepository.save(
        this.mrrMovementRepository.create({
          tenantId,
          subscriptionId: id,
          type: diff > 0 ? 'expansion' : 'contraction',
          amount: diff,
          effectiveDate: new Date(),
        }),
      );
    }

    return this.findOne(tenantId, id);
  }

  async getMetrics(tenantId: string): Promise<{
    mrr: number;
    arr: number;
    activeCount: number;
    churnRate: number;
  }> {
    // Active subscriptions count
    const activeCount = await this.subscriptionRepository.count({
      where: { tenantId, status: 'active' },
    });

    // Calculate MRR from all active subscription items
    const activeSubscriptions = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndMapMany(
        'sub.items',
        SubscriptionItem,
        'si',
        'si.subscriptionId = sub.id',
      )
      .where('sub.tenantId = :tenantId', { tenantId })
      .andWhere('sub.status = :status', { status: 'active' })
      .getMany();

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const items = (sub as any).items ?? [];
      mrr += await this.calculateMRR(
        items.map((i: SubscriptionItem) => ({ priceId: i.priceId, quantity: i.quantity })),
      );
    }

    // Churn rate: cancellations in last 30 days / total at start of period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const canceledCount = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .where('sub.tenantId = :tenantId', { tenantId })
      .andWhere('sub.status = :status', { status: 'canceled' })
      .andWhere('sub.canceledAt >= :since', { since: thirtyDaysAgo })
      .getCount();

    const totalAtStart = activeCount + canceledCount;
    const churnRate = totalAtStart > 0
      ? Math.round((canceledCount / totalAtStart) * 10000) / 100
      : 0;

    return {
      mrr,
      arr: mrr * 12,
      activeCount,
      churnRate,
    };
  }
}
