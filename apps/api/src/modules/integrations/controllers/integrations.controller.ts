import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../../shared/auth/rbac/require-permissions.decorator';
import { Permissions } from '../../../shared/auth/rbac/permissions';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { Integration } from '../entities/integration.entity';
import { SlackService } from '../services/slack.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/integrations')
export class IntegrationsController {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    private readonly slackService: SlackService,
  ) {}

  @Get()
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'List configured integrations' })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.integrationRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  @Post('slack/configure')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @ApiOperation({ summary: 'Configure Slack webhook URL' })
  @ApiResponse({ status: 200, description: 'Slack integration configured' })
  async configureSlack(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { webhookUrl: string },
  ) {
    let integration = await this.integrationRepository.findOne({
      where: { tenantId, provider: 'slack' },
    });

    if (integration) {
      integration.config = { webhookUrl: body.webhookUrl };
      integration.status = 'connected';
      integration.connectedBy = userId;
      integration.connectedAt = new Date();
      integration.errorMessage = null;
    } else {
      integration = this.integrationRepository.create({
        tenantId,
        type: 'messaging',
        provider: 'slack',
        name: 'Slack',
        status: 'connected',
        config: { webhookUrl: body.webhookUrl },
        connectedBy: userId,
        connectedAt: new Date(),
      });
    }

    return this.integrationRepository.save(integration);
  }

  @Post('slack/test')
  @RequirePermissions(Permissions.INTEGRATIONS_CONNECT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test Slack message' })
  @ApiResponse({ status: 200, description: 'Test message result' })
  async testSlack(@CurrentUser('tenantId') tenantId: string) {
    const integration = await this.integrationRepository.findOne({
      where: { tenantId, provider: 'slack' },
    });

    if (!integration || !integration.config?.webhookUrl) {
      return { ok: false, error: 'Slack is not configured' };
    }

    const result = await this.slackService.sendNotification(
      integration.config.webhookUrl,
      {
        text: 'Test message from CRM',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*CRM Integration Test*\nIf you can see this message, your Slack integration is working correctly.',
            },
          },
        ],
      },
    );

    if (result.ok) {
      integration.lastSyncAt = new Date();
      integration.errorMessage = null;
      await this.integrationRepository.save(integration);
    } else {
      integration.errorMessage = result.error ?? null;
      await this.integrationRepository.save(integration);
    }

    return result;
  }
}
