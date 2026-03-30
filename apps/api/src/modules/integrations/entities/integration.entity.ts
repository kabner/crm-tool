import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  provider: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'disconnected' })
  status: string;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ name: 'connected_by', type: 'uuid', nullable: true })
  connectedBy: string;

  @Column({ name: 'connected_at', type: 'timestamp', nullable: true })
  connectedAt: Date;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'error_message', type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}
