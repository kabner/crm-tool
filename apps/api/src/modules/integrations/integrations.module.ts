import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WebhookEndpoint,
  WebhookDelivery,
  APIKey,
  Integration,
} from './entities';
import { WebhooksController } from './controllers/webhooks.controller';
import { ApiKeysController } from './controllers/api-keys.controller';
import { IntegrationsController } from './controllers/integrations.controller';
import { WebhooksService } from './services/webhooks.service';
import { ApiKeysService } from './services/api-keys.service';
import { SlackService } from './services/slack.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookEndpoint,
      WebhookDelivery,
      APIKey,
      Integration,
    ]),
  ],
  controllers: [
    WebhooksController,
    ApiKeysController,
    IntegrationsController,
  ],
  providers: [WebhooksService, ApiKeysService, SlackService],
  exports: [WebhooksService, ApiKeysService, SlackService],
})
export class IntegrationsModule {}
