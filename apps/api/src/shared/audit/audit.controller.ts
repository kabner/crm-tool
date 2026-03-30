import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

// TODO: Add authentication guard (e.g. @UseGuards(AuthGuard)) once available

@Controller('api/v1/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<AuditLog[]> {
    // TODO: Extract tenantId from authenticated user once auth guard is in place
    const tenantId: string = req.user?.tenantId;

    const paginationOptions = {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    if (userId) {
      return this.auditService.findByUser(tenantId, userId, paginationOptions);
    }

    return this.auditService.findByTenant(tenantId, {
      ...paginationOptions,
      action,
      resourceType,
    });
  }

  @Get('resource/:resourceType/:resourceId')
  async findByResource(
    @Req() req: any,
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<AuditLog[]> {
    // TODO: Extract tenantId from authenticated user once auth guard is in place
    const tenantId: string = req.user?.tenantId;

    return this.auditService.findByResource(tenantId, resourceType, resourceId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }
}
