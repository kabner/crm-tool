import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { WebhooksService } from '../services/webhooks.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/integrations/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'List webhook endpoints' })
  @ApiResponse({ status: 200, description: 'List of webhook endpoints with delivery stats' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.webhooksService.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Get webhook endpoint detail with recent deliveries' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint detail' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  @ApiResponse({ status: 201, description: 'Webhook endpoint created' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Webhook endpoint updated' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Webhook endpoint deleted' })
  @ApiResponse({ status: 404, description: 'Endpoint not found' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.remove(tenantId, id);
  }

  @Get(':id/deliveries')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Get delivery log for a webhook endpoint' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Paginated delivery log' })
  async getDeliveries(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.webhooksService.getDeliveries(tenantId, id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Post(':id/test')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Send a test webhook' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Test webhook delivery result' })
  async test(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.test(tenantId, id);
  }

  @Post('deliveries/:id/retry')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Retry a failed webhook delivery' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Retry result' })
  async retry(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.webhooksService.retry(tenantId, id);
  }
}
