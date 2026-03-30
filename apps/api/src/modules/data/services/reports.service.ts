import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Report } from '../entities/report.entity';
import { CreateReportDto } from '../dto/create-report.dto';
import { UpdateReportDto } from '../dto/update-report.dto';

const DATA_SOURCE_TABLE_MAP: Record<string, string> = {
  contacts: 'contacts',
  companies: 'companies',
  deals: 'deals',
  tickets: 'tickets',
  activities: 'activities',
  invoices: 'invoices',
  subscriptions: 'subscriptions',
};

// Allowed columns per data source to prevent SQL injection
const ALLOWED_FIELDS: Record<string, string[]> = {
  contacts: [
    'id', 'first_name', 'last_name', 'email', 'phone', 'job_title',
    'lifecycle_stage', 'lead_status', 'owner_id', 'source', 'tags',
    'last_activity_at', 'created_at', 'updated_at',
  ],
  companies: [
    'id', 'name', 'domain', 'industry', 'size', 'phone',
    'owner_id', 'created_at', 'updated_at',
  ],
  deals: [
    'id', 'name', 'amount', 'stage_id', 'pipeline_id', 'close_date',
    'owner_id', 'company_id', 'won', 'lost_reason', 'created_at', 'updated_at',
  ],
  tickets: [
    'id', 'number', 'subject', 'status', 'priority', 'category_id',
    'contact_id', 'company_id', 'assigned_to', 'channel', 'satisfaction',
    'first_response_at', 'resolved_at', 'closed_at', 'created_at', 'updated_at',
  ],
  activities: [
    'id', 'type', 'subject', 'contact_id', 'company_id', 'deal_id',
    'user_id', 'due_date', 'completed_at', 'created_at', 'updated_at',
  ],
};

// Map camelCase field names to snake_case column names
const FIELD_COLUMN_MAP: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  jobTitle: 'job_title',
  lifecycleStage: 'lifecycle_stage',
  leadStatus: 'lead_status',
  ownerId: 'owner_id',
  lastActivityAt: 'last_activity_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  stageId: 'stage_id',
  pipelineId: 'pipeline_id',
  closeDate: 'close_date',
  companyId: 'company_id',
  lostReason: 'lost_reason',
  categoryId: 'category_id',
  contactId: 'contact_id',
  assignedTo: 'assigned_to',
  firstResponseAt: 'first_response_at',
  resolvedAt: 'resolved_at',
  closedAt: 'closed_at',
  dealId: 'deal_id',
  userId: 'user_id',
  dueDate: 'due_date',
  completedAt: 'completed_at',
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateReportDto,
  ): Promise<Report> {
    const report = this.reportRepository.create({
      ...dto,
      tenantId,
      createdBy: userId,
    });
    return this.reportRepository.save(report);
  }

  async findAll(tenantId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateReportDto,
  ): Promise<Report> {
    const report = await this.findOne(tenantId, id);
    Object.assign(report, dto);
    return this.reportRepository.save(report);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const report = await this.findOne(tenantId, id);
    await this.reportRepository.remove(report);
  }

  async execute(
    tenantId: string,
    reportId: string,
  ): Promise<{ columns: string[]; rows: any[]; total: number }> {
    const report = await this.findOne(tenantId, reportId);
    return this.runQuery(tenantId, report);
  }

  async preview(
    tenantId: string,
    dto: CreateReportDto,
  ): Promise<{ columns: string[]; rows: any[]; total: number }> {
    const report = {
      dataSource: dto.dataSource,
      fields: dto.fields,
      filters: dto.filters || [],
      groupBy: dto.groupBy,
      sort: dto.sort,
    } as Report;

    return this.runQuery(tenantId, report);
  }

  private async runQuery(
    tenantId: string,
    report: Pick<Report, 'dataSource' | 'fields' | 'filters' | 'groupBy' | 'sort'>,
  ): Promise<{ columns: string[]; rows: any[]; total: number }> {
    const tableName = DATA_SOURCE_TABLE_MAP[report.dataSource];
    if (!tableName) {
      throw new BadRequestException(`Invalid data source: ${report.dataSource}`);
    }

    const allowedFields = ALLOWED_FIELDS[report.dataSource];
    if (!allowedFields) {
      throw new BadRequestException(`Data source ${report.dataSource} is not queryable yet`);
    }

    // Resolve field names to column names
    const columns = report.fields.map((field) => {
      const col = FIELD_COLUMN_MAP[field] || field;
      if (!allowedFields.includes(col)) {
        throw new BadRequestException(`Field "${field}" is not available for ${report.dataSource}`);
      }
      return col;
    });

    const qb = this.dataSource
      .createQueryBuilder()
      .from(tableName, 't')
      .where('t.tenant_id = :tenantId', { tenantId });

    // SELECT fields
    if (report.groupBy?.field) {
      const groupCol = FIELD_COLUMN_MAP[report.groupBy.field] || report.groupBy.field;
      if (!allowedFields.includes(groupCol)) {
        throw new BadRequestException(`Group by field "${report.groupBy.field}" is not available`);
      }
      qb.select(`t.${groupCol}`, report.groupBy.field);
      qb.addSelect('COUNT(*)', 'count');

      // Add any aggregate fields
      columns.forEach((col) => {
        if (col !== groupCol) {
          qb.addSelect(`t.${col}`, col);
        }
      });

      qb.groupBy(`t.${groupCol}`);
    } else {
      columns.forEach((col, i) => {
        const alias = report.fields[i] || col;
        if (i === 0) {
          qb.select(`t.${col}`, alias);
        } else {
          qb.addSelect(`t.${col}`, alias);
        }
      });
    }

    // Apply filters
    if (report.filters?.length) {
      report.filters.forEach((filter, index) => {
        const col = FIELD_COLUMN_MAP[filter.field] || filter.field;
        if (!allowedFields.includes(col)) return;

        const paramName = `filter_${index}`;
        switch (filter.operator) {
          case 'eq':
            qb.andWhere(`t.${col} = :${paramName}`, { [paramName]: filter.value });
            break;
          case 'neq':
            qb.andWhere(`t.${col} != :${paramName}`, { [paramName]: filter.value });
            break;
          case 'gt':
            qb.andWhere(`t.${col} > :${paramName}`, { [paramName]: filter.value });
            break;
          case 'gte':
            qb.andWhere(`t.${col} >= :${paramName}`, { [paramName]: filter.value });
            break;
          case 'lt':
            qb.andWhere(`t.${col} < :${paramName}`, { [paramName]: filter.value });
            break;
          case 'lte':
            qb.andWhere(`t.${col} <= :${paramName}`, { [paramName]: filter.value });
            break;
          case 'contains':
            qb.andWhere(`t.${col} ILIKE :${paramName}`, { [paramName]: `%${filter.value}%` });
            break;
          case 'starts_with':
            qb.andWhere(`t.${col} ILIKE :${paramName}`, { [paramName]: `${filter.value}%` });
            break;
          case 'is_null':
            qb.andWhere(`t.${col} IS NULL`);
            break;
          case 'is_not_null':
            qb.andWhere(`t.${col} IS NOT NULL`);
            break;
        }
      });
    }

    // Apply sort
    if (report.sort?.field) {
      const sortCol = FIELD_COLUMN_MAP[report.sort.field] || report.sort.field;
      if (allowedFields.includes(sortCol)) {
        qb.orderBy(`t.${sortCol}`, report.sort.order === 'ASC' ? 'ASC' : 'DESC');
      }
    } else {
      qb.orderBy('t.created_at', 'DESC');
    }

    // Limit for safety
    qb.limit(1000);

    const rows = await qb.getRawMany();
    const total = rows.length;

    return {
      columns: report.fields,
      rows,
      total,
    };
  }
}
