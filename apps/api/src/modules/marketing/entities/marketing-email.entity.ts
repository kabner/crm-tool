import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailTemplate } from './email-template.entity';

@Entity('marketing_emails')
export class MarketingEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column({ name: 'preview_text', type: 'varchar', nullable: true })
  previewText: string | null;

  @Column({ name: 'from_name' })
  fromName: string;

  @Column({ name: 'from_email' })
  fromEmail: string;

  @Column({ name: 'reply_to', type: 'varchar', nullable: true })
  replyTo: string | null;

  @Column({ name: 'content_html', type: 'text' })
  contentHtml: string;

  @Column({ name: 'content_json', type: 'jsonb' })
  contentJson: Record<string, any>;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ default: 'draft' })
  status: string;

  @Column({ name: 'send_type' })
  sendType: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'ab_test_config', type: 'jsonb', nullable: true })
  abTestConfig: Record<string, any> | null;

  @Column({ name: 'stats_cache', type: 'jsonb', default: '{}' })
  statsCache: Record<string, any>;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => EmailTemplate)
  @JoinColumn({ name: 'template_id' })
  template: EmailTemplate;
}
