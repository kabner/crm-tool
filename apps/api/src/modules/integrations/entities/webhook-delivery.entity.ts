import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WebhookEndpoint } from './webhook-endpoint.entity';

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'endpoint_id' })
  endpointId: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ name: 'last_attempt_at', type: 'timestamp', nullable: true })
  lastAttemptAt: Date;

  @Column({ name: 'response_status', type: 'integer', nullable: true })
  responseStatus: number;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => WebhookEndpoint)
  @JoinColumn({ name: 'endpoint_id' })
  endpoint: WebhookEndpoint;
}
