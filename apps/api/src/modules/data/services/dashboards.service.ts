import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard } from '../entities/dashboard.entity';
import { DashboardWidget } from '../entities/dashboard-widget.entity';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';
import { CreateWidgetDto } from '../dto/create-widget.dto';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectRepository(Dashboard)
    private readonly dashboardRepository: Repository<Dashboard>,
    @InjectRepository(DashboardWidget)
    private readonly widgetRepository: Repository<DashboardWidget>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateDashboardDto,
  ): Promise<Dashboard> {
    const dashboard = this.dashboardRepository.create({
      ...dto,
      tenantId,
      createdBy: userId,
    });
    return this.dashboardRepository.save(dashboard);
  }

  async findAll(
    tenantId: string,
  ): Promise<(Dashboard & { widgetCount: number })[]> {
    const dashboards = await this.dashboardRepository
      .createQueryBuilder('d')
      .where('d.tenant_id = :tenantId', { tenantId })
      .loadRelationCountAndMap('d.widgetCount', 'd.widgets')
      .orderBy('d.created_at', 'DESC')
      .getMany();

    // Widget count is loaded via the relation count map, but since
    // Dashboard entity doesn't have a widgets relation, we count manually.
    const results = await Promise.all(
      dashboards.map(async (dashboard) => {
        const widgetCount = await this.widgetRepository.count({
          where: { dashboardId: dashboard.id },
        });
        return { ...dashboard, widgetCount };
      }),
    );

    return results;
  }

  async findOne(tenantId: string, id: string): Promise<Dashboard & { widgets: DashboardWidget[] }> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id, tenantId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    const widgets = await this.widgetRepository.find({
      where: { dashboardId: id },
      order: { position: 'ASC' as any },
    });

    return { ...dashboard, widgets };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDashboardDto,
  ): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id, tenantId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    Object.assign(dashboard, dto);
    return this.dashboardRepository.save(dashboard);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id, tenantId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    // Remove all widgets first
    await this.widgetRepository.delete({ dashboardId: id });
    await this.dashboardRepository.remove(dashboard);
  }

  async addWidget(
    tenantId: string,
    dashboardId: string,
    dto: CreateWidgetDto,
  ): Promise<DashboardWidget> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id: dashboardId, tenantId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    const widget = this.widgetRepository.create({
      ...dto,
      dashboardId,
    });

    return this.widgetRepository.save(widget);
  }

  async updateWidget(
    tenantId: string,
    dashboardId: string,
    widgetId: string,
    dto: Partial<CreateWidgetDto>,
  ): Promise<DashboardWidget> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id: dashboardId, tenantId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    Object.assign(widget, dto);
    return this.widgetRepository.save(widget);
  }

  async removeWidget(
    tenantId: string,
    dashboardId: string,
    widgetId: string,
  ): Promise<void> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id: dashboardId, tenantId },
    });

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    await this.widgetRepository.remove(widget);
  }

  async getSystemDashboards(
    tenantId: string,
    userId: string,
  ): Promise<Dashboard[]> {
    let systemDashboards = await this.dashboardRepository.find({
      where: { tenantId, isSystem: true },
    });

    if (systemDashboards.length === 0) {
      // Create default system dashboards
      const defaults = [
        {
          name: 'Sales Dashboard',
          description: 'Overview of sales performance and pipeline',
          isSystem: true,
          defaultDateRange: 'last_30_days',
          tenantId,
          createdBy: userId,
        },
        {
          name: 'Marketing Dashboard',
          description: 'Email performance, lead generation, and campaign metrics',
          isSystem: true,
          defaultDateRange: 'last_30_days',
          tenantId,
          createdBy: userId,
        },
        {
          name: 'Service Dashboard',
          description: 'Ticket metrics, response times, and customer satisfaction',
          isSystem: true,
          defaultDateRange: 'last_30_days',
          tenantId,
          createdBy: userId,
        },
      ];

      const dashboards = this.dashboardRepository.create(defaults);
      systemDashboards = await this.dashboardRepository.save(dashboards);
    }

    return systemDashboards;
  }
}
