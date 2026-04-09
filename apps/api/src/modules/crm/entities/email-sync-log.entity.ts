import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('email_sync_log')
@Unique(['userId', 'googleMessageId'])
@Index('idx_email_sync_log_user', ['userId', 'googleMessageId'])
export class EmailSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'google_message_id' })
  googleMessageId: string;

  @Column({ name: 'activity_id', nullable: true })
  activityId: string;

  @CreateDateColumn({ name: 'synced_at' })
  syncedAt: Date;
}
