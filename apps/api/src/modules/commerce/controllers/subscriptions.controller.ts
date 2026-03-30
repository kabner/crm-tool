import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { SubscriptionsService } from '../services/subscriptions.service';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';

@ApiTags('Commerce - Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/commerce/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List subscriptions with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of subscriptions' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.findAll(tenantId, { page, limit, status });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get subscription metrics (MRR, ARR, active count, churn rate)' })
  @ApiResponse({ status: 200, description: 'Subscription metrics' })
  async getMetrics(@CurrentUser('tenantId') tenantId: string) {
    return this.subscriptionsService.getMetrics(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single subscription by ID' })
  @ApiResponse({ status: 200, description: 'Subscription details with items' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(tenantId, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled' })
  async cancel(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { immediately?: boolean },
  ) {
    return this.subscriptionsService.cancel(tenantId, id, body.immediately ?? false);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  @ApiResponse({ status: 200, description: 'Subscription paused' })
  async pause(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.pause(tenantId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused subscription' })
  @ApiResponse({ status: 200, description: 'Subscription resumed' })
  async resume(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.resume(tenantId, id);
  }

  @Post(':id/change-plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiResponse({ status: 200, description: 'Subscription plan changed' })
  async changePlan(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { items: { productId: string; priceId: string; quantity?: number }[] },
  ) {
    return this.subscriptionsService.changePlan(tenantId, id, body.items);
  }
}
