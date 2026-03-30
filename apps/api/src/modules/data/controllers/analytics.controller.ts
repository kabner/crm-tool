import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/data/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overview analytics for the main dashboard' })
  @ApiResponse({ status: 200, description: 'Overview analytics data' })
  async getOverview(@CurrentUser('tenantId') tenantId: string) {
    return this.analyticsService.getOverview(tenantId);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales summary analytics' })
  @ApiQuery({ name: 'start', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'end', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'Sales analytics data' })
  async getSales(
    @CurrentUser('tenantId') tenantId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getSalesSummary(tenantId, { start, end });
  }

  @Get('marketing')
  @ApiOperation({ summary: 'Get marketing summary analytics' })
  @ApiQuery({ name: 'start', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'end', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'Marketing analytics data' })
  async getMarketing(
    @CurrentUser('tenantId') tenantId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getMarketingSummary(tenantId, { start, end });
  }

  @Get('service')
  @ApiOperation({ summary: 'Get service summary analytics' })
  @ApiQuery({ name: 'start', required: false, description: 'Start date (ISO)' })
  @ApiQuery({ name: 'end', required: false, description: 'End date (ISO)' })
  @ApiResponse({ status: 200, description: 'Service analytics data' })
  async getService(
    @CurrentUser('tenantId') tenantId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.analyticsService.getServiceSummary(tenantId, { start, end });
  }
}
