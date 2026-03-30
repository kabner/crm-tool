import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('webhook_endpoints')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar' })
  secret: string;

  @Column({ type: 'text', array: true })
  events: string[];

  @Column({ name: 'filter_config', type: 'jsonb', nullable: true })
  filterConfig: Record<string, any> | null;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
