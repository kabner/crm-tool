import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { RevenueService } from '../services/revenue.service';

@ApiTags('Commerce - Revenue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/commerce/revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('mrr')
  @ApiOperation({ summary: 'Get current MRR' })
  @ApiResponse({ status: 200, description: 'Current MRR in cents' })
  async getMRR(@CurrentUser('tenantId') tenantId: string) {
    return this.revenueService.getMRR(tenantId);
  }

  @Get('arr')
  @ApiOperation({ summary: 'Get current ARR' })
  @ApiResponse({ status: 200, description: 'Current ARR in cents' })
  async getARR(@CurrentUser('tenantId') tenantId: string) {
    return this.revenueService.getARR(tenantId);
  }

  @Get('mrr-movements')
  @ApiOperation({ summary: 'Get MRR movements for a period' })
  @ApiResponse({ status: 200, description: 'MRR movements and summary' })
  async getMRRMovements(
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.revenueService.getMRRMovements(tenantId, { startDate, endDate });
  }

  @Get('over-time')
  @ApiOperation({ summary: 'Get revenue over time' })
  @ApiResponse({ status: 200, description: 'Revenue grouped by time interval' })
  async getRevenueOverTime(
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval?: 'day' | 'week' | 'month',
  ) {
    return this.revenueService.getRevenueOverTime(
      tenantId,
      startDate,
      endDate,
      interval,
    );
  }

  @Get('ltv')
  @ApiOperation({ summary: 'Get customer lifetime value' })
  @ApiResponse({ status: 200, description: 'LTV metrics' })
  async getLTV(@CurrentUser('tenantId') tenantId: string) {
    return this.revenueService.getLTV(tenantId);
  }
}
