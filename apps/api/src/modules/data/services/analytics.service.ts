import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, IsNull, Not } from 'typeorm';
import { Contact } from '../../crm/entities/contact.entity';
import { Company } from '../../crm/entities/company.entity';
import { Deal } from '../../crm/entities/deal.entity';
import { Activity } from '../../crm/entities/activity.entity';
import { Ticket } from '../../service/entities/ticket.entity';

interface DateRange {
  start?: string;
  end?: string;
}

function getDateRange(dateRange?: DateRange): { start: Date; end: Date } {
  const end = dateRange?.end ? new Date(dateRange.end) : new Date();
  const start = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  return { start, end };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async getSalesSummary(tenantId: string, dateRange?: DateRange) {
    const { start, end } = getDateRange(dateRange);

    const totalDeals = await this.dealRepository.count({
      where: {
        tenantId,
        createdAt: Between(start, end),
      },
    });

    const wonDeals = await this.dealRepository.count({
      where: {
        tenantId,
        won: true,
        updatedAt: Between(start, end),
      },
    });

    const closedDeals = await this.dealRepository.count({
      where: {
        tenantId,
        won: Not(IsNull()),
        updatedAt: Between(start, end),
      },
    });

    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    // Total revenue from won deals
    const revenueResult = await this.dealRepository
      .createQueryBuilder('deal')
      .select('COALESCE(SUM(deal.amount), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(deal.amount), 0)', 'avgDealSize')
      .where('deal.tenant_id = :tenantId', { tenantId })
      .andWhere('deal.won = true')
      .andWhere('deal.updated_at BETWEEN :start AND :end', { start, end })
      .getRawOne();

    return {
      totalDeals,
      wonDeals,
      winRate,
      totalRevenue: parseFloat(revenueResult?.totalRevenue || '0'),
      avgDealSize: parseFloat(revenueResult?.avgDealSize || '0'),
    };
  }

  async getMarketingSummary(tenantId: string, dateRange?: DateRange) {
    const { start, end } = getDateRange(dateRange);

    // New leads (contacts created in date range with lifecycle_stage = 'lead')
    const newLeads = await this.contactRepository.count({
      where: {
        tenantId,
        lifecycleStage: 'lead',
        createdAt: Between(start, end),
      },
    });

    // Total contacts created in range
    const newContacts = await this.contactRepository.count({
      where: {
        tenantId,
        createdAt: Between(start, end),
      },
    });

    // Email metrics are approximated from activities of type 'email'
    const emailActivities = await this.activityRepository.count({
      where: {
        tenantId,
        type: 'email',
        createdAt: Between(start, end),
      },
    });

    // Form submissions approximated from activities of type 'form_submission'
    const formSubmissions = await this.activityRepository.count({
      where: {
        tenantId,
        type: 'form_submission',
        createdAt: Between(start, end),
      },
    });

    return {
      emailsSent: emailActivities,
      openRate: 0, // Requires email tracking data
      clickRate: 0, // Requires email tracking data
      formSubmissions,
      newLeads,
      newContacts,
    };
  }

  async getServiceSummary(tenantId: string, dateRange?: DateRange) {
    const { start, end } = getDateRange(dateRange);

    const openTickets = await this.ticketRepository.count({
      where: {
        tenantId,
        status: Not('closed'),
      },
    });

    const ticketsCreated = await this.ticketRepository.count({
      where: {
        tenantId,
        createdAt: Between(start, end),
      },
    });

    const ticketsResolved = await this.ticketRepository.count({
      where: {
        tenantId,
        resolvedAt: Between(start, end),
      },
    });

    // Average response time (in hours)
    const responseTimeResult = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ticket.first_response_at - ticket.created_at)) / 3600)',
        'avgResponseTime',
      )
      .where('ticket.tenant_id = :tenantId', { tenantId })
      .andWhere('ticket.first_response_at IS NOT NULL')
      .andWhere('ticket.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // Average resolution time (in hours)
    const resolutionTimeResult = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ticket.resolved_at - ticket.created_at)) / 3600)',
        'avgResolutionTime',
      )
      .where('ticket.tenant_id = :tenantId', { tenantId })
      .andWhere('ticket.resolved_at IS NOT NULL')
      .andWhere('ticket.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // CSAT score from satisfaction field
    const csatResult = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN ticket.satisfaction = 'good' THEN 1 ELSE 0 END)",
        'satisfied',
      )
      .where('ticket.tenant_id = :tenantId', { tenantId })
      .andWhere('ticket.satisfaction IS NOT NULL')
      .andWhere('ticket.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const csatTotal = parseInt(csatResult?.total || '0', 10);
    const csatSatisfied = parseInt(csatResult?.satisfied || '0', 10);
    const csatScore = csatTotal > 0 ? Math.round((csatSatisfied / csatTotal) * 100) : 0;

    return {
      openTickets,
      ticketsCreated,
      ticketsResolved,
      avgResponseTime: parseFloat(responseTimeResult?.avgResponseTime || '0'),
      avgResolutionTime: parseFloat(resolutionTimeResult?.avgResolutionTime || '0'),
      csatScore,
    };
  }

  async getOverview(tenantId: string) {
    const totalContacts = await this.contactRepository.count({
      where: { tenantId },
    });

    const totalCompanies = await this.companyRepository.count({
      where: { tenantId },
    });

    // Open deals (won is null)
    const openDeals = await this.dealRepository.count({
      where: { tenantId, won: IsNull() },
    });

    const openDealsValueResult = await this.dealRepository
      .createQueryBuilder('deal')
      .select('COALESCE(SUM(deal.amount), 0)', 'totalValue')
      .where('deal.tenant_id = :tenantId', { tenantId })
      .andWhere('deal.won IS NULL')
      .getRawOne();

    const openDealsValue = parseFloat(openDealsValueResult?.totalValue || '0');

    const openTickets = await this.ticketRepository.count({
      where: { tenantId, status: Not('closed') },
    });

    // Activities this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const activitiesThisMonth = await this.activityRepository.count({
      where: {
        tenantId,
        createdAt: MoreThanOrEqual(monthStart),
      },
    });

    // Quick summaries
    const sales = await this.getSalesSummary(tenantId);
    const marketing = await this.getMarketingSummary(tenantId);
    const service = await this.getServiceSummary(tenantId);

    return {
      totalContacts,
      totalCompanies,
      openDeals,
      openDealsValue,
      openTickets,
      activitiesThisMonth,
      sales,
      marketing,
      service,
    };
  }
}
