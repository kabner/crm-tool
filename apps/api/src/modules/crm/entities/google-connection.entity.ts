import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('google_connections')
@Unique(['userId'])
export class GoogleConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'google_email' })
  googleEmail: string;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text' })
  refreshToken: string;

  @Column({ name: 'token_expiry' })
  tokenExpiry: Date;

  @Column({ default: '' })
  scopes: string;

  @Column({ name: 'gmail_history_id', nullable: true })
  gmailHistoryId: string;

  @Column({ name: 'gmail_last_sync_at', nullable: true })
  gmailLastSyncAt: Date;

  @Column({ name: 'calendar_sync_token', nullable: true })
  calendarSyncToken: string;

  @Column({ name: 'calendar_last_sync_at', nullable: true })
  calendarLastSyncAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
