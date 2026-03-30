import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';
import { WebhookEndpoint } from '../entities/webhook-endpoint.entity';
import { WebhookDelivery } from '../entities/webhook-delivery.entity';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookEndpoint)
    private readonly endpointRepository: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookDelivery)
    private readonly deliveryRepository: Repository<WebhookDelivery>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateWebhookDto,
  ): Promise<WebhookEndpoint> {
    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = this.endpointRepository.create({
      tenantId,
      url: dto.url,
      events: dto.events,
      filterConfig: dto.filterConfig ?? null,
      secret,
      status: 'active',
      createdBy: userId,
    });

    return this.endpointRepository.save(endpoint);
  }

  async findAll(
    tenantId: string,
  ): Promise<
    (WebhookEndpoint & { successCount: number; failCount: number })[]
  > {
    const endpoints = await this.endpointRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const [successCount, failCount] = await Promise.all([
          this.deliveryRepository.count({
            where: {
              endpointId: endpoint.id,
              status: 'success',
              createdAt: MoreThanOrEqual(oneDayAgo),
            },
          }),
          this.deliveryRepository.count({
            where: {
              endpointId: endpoint.id,
              status: 'failed',
              createdAt: MoreThanOrEqual(oneDayAgo),
            },
          }),
        ]);

        return { ...endpoint, successCount, failCount };
      }),
    );

    return results;
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<WebhookEndpoint & { recentDeliveries: WebhookDelivery[] }> {
    const endpoint = await this.endpointRepository.findOne({
      where: { id, tenantId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const recentDeliveries = await this.deliveryRepository.find({
      where: { endpointId: id },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return { ...endpoint, recentDeliveries };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateWebhookDto,
  ): Promise<WebhookEndpoint> {
    const endpoint = await this.endpointRepository.findOne({
      where: { id, tenantId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    if (dto.url !== undefined) endpoint.url = dto.url;
    if (dto.events !== undefined) endpoint.events = dto.events;
    if (dto.status !== undefined) endpoint.status = dto.status;

    return this.endpointRepository.save(endpoint);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const endpoint = await this.endpointRepository.findOne({
      where: { id, tenantId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    await this.endpointRepository.remove(endpoint);
  }

  async deliver(event: {
    type: string;
    tenantId: string;
    payload: any;
  }): Promise<void> {
    const endpoints = await this.endpointRepository.find({
      where: { tenantId: event.tenantId, status: 'active' },
    });

    const matching = endpoints.filter((ep) => ep.events.includes(event.type));

    await Promise.all(
      matching.map((endpoint) =>
        this.deliverToEndpoint(endpoint, event.type, event.payload),
      ),
    );
  }

  private async deliverToEndpoint(
    endpoint: WebhookEndpoint,
    eventType: string,
    payload: any,
  ): Promise<void> {
    const delivery = this.deliveryRepository.create({
      endpointId: endpoint.id,
      eventType,
      payload,
      status: 'pending',
      attempts: 0,
    });

    const saved = await this.deliveryRepository.save(delivery);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(payload);
    const signaturePayload = `${timestamp}.${body}`;
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(signaturePayload)
      .digest('hex');

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': saved.id,
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Timestamp': timestamp,
        },
        body,
        signal: AbortSignal.timeout(30000),
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      saved.status = response.ok ? 'success' : 'failed';
      saved.responseStatus = response.status;
      saved.responseBody = responseBody.substring(0, 4096);
      saved.durationMs = durationMs;
      saved.attempts = 1;
      saved.lastAttemptAt = new Date();

      if (!response.ok) {
        saved.nextRetryAt = new Date(Date.now() + 60 * 1000);
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      saved.status = 'failed';
      saved.responseBody = error instanceof Error ? error.message : 'Unknown error';
      saved.durationMs = durationMs;
      saved.attempts = 1;
      saved.lastAttemptAt = new Date();
      saved.nextRetryAt = new Date(Date.now() + 60 * 1000);
      this.logger.warn(
        `Webhook delivery failed for endpoint ${endpoint.id}: ${saved.responseBody}`,
      );
    }

    await this.deliveryRepository.save(saved);
  }

  async getDeliveries(
    tenantId: string,
    endpointId: string,
    filters: { page?: number; limit?: number; status?: string } = {},
  ): Promise<{
    data: WebhookDelivery[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const endpoint = await this.endpointRepository.findOne({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: any = { endpointId };
    if (filters.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.deliveryRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async retry(tenantId: string, deliveryId: string): Promise<WebhookDelivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: ['endpoint'],
    });

    if (!delivery || delivery.endpoint.tenantId !== tenantId) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== 'failed') {
      throw new NotFoundException('Only failed deliveries can be retried');
    }

    const endpoint = delivery.endpoint;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(delivery.payload);
    const signaturePayload = `${timestamp}.${body}`;
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(signaturePayload)
      .digest('hex');

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': delivery.id,
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Timestamp': timestamp,
        },
        body,
        signal: AbortSignal.timeout(30000),
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      delivery.status = response.ok ? 'success' : 'failed';
      delivery.responseStatus = response.status;
      delivery.responseBody = responseBody.substring(0, 4096);
      delivery.durationMs = durationMs;
      delivery.attempts += 1;
      delivery.lastAttemptAt = new Date();
      delivery.nextRetryAt = response.ok
        ? null
        : new Date(Date.now() + 60 * 1000);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      delivery.status = 'failed';
      delivery.responseBody =
        error instanceof Error ? error.message : 'Unknown error';
      delivery.durationMs = durationMs;
      delivery.attempts += 1;
      delivery.lastAttemptAt = new Date();
      delivery.nextRetryAt = new Date(Date.now() + 60 * 1000);
    }

    return this.deliveryRepository.save(delivery);
  }

  async test(tenantId: string, endpointId: string): Promise<WebhookDelivery> {
    const endpoint = await this.endpointRepository.findOne({
      where: { id: endpointId, tenantId },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found');
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        endpointId: endpoint.id,
      },
    };

    const delivery = this.deliveryRepository.create({
      endpointId: endpoint.id,
      eventType: 'webhook.test',
      payload: testPayload,
      status: 'pending',
      attempts: 0,
    });

    const saved = await this.deliveryRepository.save(delivery);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify(testPayload);
    const signaturePayload = `${timestamp}.${body}`;
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(signaturePayload)
      .digest('hex');

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': saved.id,
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Timestamp': timestamp,
        },
        body,
        signal: AbortSignal.timeout(30000),
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      saved.status = response.ok ? 'success' : 'failed';
      saved.responseStatus = response.status;
      saved.responseBody = responseBody.substring(0, 4096);
      saved.durationMs = durationMs;
      saved.attempts = 1;
      saved.lastAttemptAt = new Date();
    } catch (error) {
      const durationMs = Date.now() - startTime;
      saved.status = 'failed';
      saved.responseBody =
        error instanceof Error ? error.message : 'Unknown error';
      saved.durationMs = durationMs;
      saved.attempts = 1;
      saved.lastAttemptAt = new Date();
    }

    return this.deliveryRepository.save(saved);
  }
}
