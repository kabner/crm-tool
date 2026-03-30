import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionItem } from '../entities/subscription-item.entity';
import { Price } from '../entities/price.entity';
import { MRRMovement } from '../entities/mrr-movement.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class RevenueService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionItem)
    private readonly subscriptionItemRepository: Repository<SubscriptionItem>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(MRRMovement)
    private readonly mrrMovementRepository: Repository<MRRMovement>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  private async calculateItemMRR(priceId: string, quantity: number): Promise<number> {
    const price = await this.priceRepository.findOne({ where: { id: priceId } });
    if (!price || price.type !== 'recurring') return 0;

    let monthlyAmount = price.amount * quantity;
    if (price.interval === 'year') {
      monthlyAmount = Math.round(monthlyAmount / 12);
    } else if (price.interval === 'week') {
      monthlyAmount = Math.round(monthlyAmount * 4.33);
    } else if (price.interval === 'day') {
      monthlyAmount = Math.round(monthlyAmount * 30);
    }
    return monthlyAmount;
  }

  async getMRR(tenantId: string): Promise<{ mrr: number }> {
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
      for (const item of items) {
        mrr += await this.calculateItemMRR(item.priceId, item.quantity);
      }
    }

    return { mrr };
  }

  async getARR(tenantId: string): Promise<{ arr: number }> {
    const { mrr } = await this.getMRR(tenantId);
    return { arr: mrr * 12 };
  }

  async getMRRMovements(
    tenantId: string,
    period: { startDate?: string; endDate?: string },
  ): Promise<{
    movements: MRRMovement[];
    summary: { new: number; expansion: number; contraction: number; churn: number; net: number };
  }> {
    const qb = this.mrrMovementRepository
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId });

    if (period.startDate) {
      qb.andWhere('m.effectiveDate >= :startDate', { startDate: period.startDate });
    }
    if (period.endDate) {
      qb.andWhere('m.effectiveDate <= :endDate', { endDate: period.endDate });
    }

    qb.orderBy('m.effectiveDate', 'DESC');

    const movements = await qb.getMany();

    const summary = { new: 0, expansion: 0, contraction: 0, churn: 0, net: 0 };
    for (const m of movements) {
      const type = m.type as keyof typeof summary;
      if (type in summary) {
        summary[type] += m.amount;
      }
      summary.net += m.amount;
    }

    return { movements, summary };
  }

  async getRevenueOverTime(
    tenantId: string,
    startDate: string,
    endDate: string,
    interval: 'day' | 'week' | 'month' = 'month',
  ): Promise<{ period: string; revenue: number }[]> {
    let dateTrunc: string;
    switch (interval) {
      case 'day':
        dateTrunc = 'day';
        break;
      case 'week':
        dateTrunc = 'week';
        break;
      default:
        dateTrunc = 'month';
    }

    const results = await this.paymentRepository
      .createQueryBuilder('p')
      .select(`DATE_TRUNC('${dateTrunc}', p.paid_at)`, 'period')
      .addSelect('SUM(p.amount)', 'revenue')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.status = :status', { status: 'succeeded' })
      .andWhere('p.paidAt >= :startDate', { startDate })
      .andWhere('p.paidAt <= :endDate', { endDate })
      .groupBy(`DATE_TRUNC('${dateTrunc}', p.paid_at)`)
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      period: r.period,
      revenue: parseInt(r.revenue, 10) || 0,
    }));
  }

  async getLTV(tenantId: string): Promise<{ ltv: number; avgRevenuePerCustomer: number; avgLifespanMonths: number }> {
    // Average revenue per customer
    const revenueResult = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COUNT(DISTINCT p.contact_id)', 'customerCount')
      .addSelect('SUM(p.amount)', 'totalRevenue')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.status = :status', { status: 'succeeded' })
      .getRawOne();

    const customerCount = parseInt(revenueResult?.customerCount, 10) || 0;
    const totalRevenue = parseInt(revenueResult?.totalRevenue, 10) || 0;
    const avgRevenuePerCustomer = customerCount > 0
      ? Math.round(totalRevenue / customerCount)
      : 0;

    // Average subscription lifespan in months
    const lifespanResult = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select(
        `AVG(EXTRACT(EPOCH FROM (COALESCE(sub.canceled_at, NOW()) - sub.created_at)) / 2592000)`,
        'avgMonths',
      )
      .where('sub.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const avgLifespanMonths = Math.round(
      parseFloat(lifespanResult?.avgMonths ?? '0') * 10,
    ) / 10;

    return {
      ltv: avgRevenuePerCustomer,
      avgRevenuePerCustomer,
      avgLifespanMonths,
    };
  }
}
