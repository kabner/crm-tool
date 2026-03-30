import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(entry: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(entry);
    return this.auditLogRepository.save(auditLog);
  }

  async findByResource(
    tenantId: string,
    resourceType: string,
    resourceId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId, resourceType, resourceId },
      order: { occurredAt: 'DESC' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async findByUser(
    tenantId: string,
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId, userId },
      order: { occurredAt: 'DESC' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async findByTenant(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
      resourceType?: string;
    },
  ): Promise<AuditLog[]> {
    const where: Record<string, any> = { tenantId };

    if (options?.action) {
      where.action = options.action;
    }
    if (options?.resourceType) {
      where.resourceType = options.resourceType;
    }

    return this.auditLogRepository.find({
      where,
      order: { occurredAt: 'DESC' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }
}
