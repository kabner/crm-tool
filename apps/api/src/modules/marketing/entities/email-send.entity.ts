import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarketingEmail } from './marketing-email.entity';

@Entity('email_sends')
@Index('IDX_email_sends_tenant_email', ['tenantId', 'emailId'])
@Index('IDX_email_sends_tenant_contact', ['tenantId', 'contactId'])
export class EmailSend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'email_id', type: 'uuid' })
  emailId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ type: 'varchar', nullable: true })
  variant: string | null;

  @Column()
  status: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'opened_at', type: 'timestamp', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'open_count', type: 'int', default: 0 })
  openCount: number;

  @Column({ name: 'clicked_at', type: 'timestamp', nullable: true })
  clickedAt: Date | null;

  @Column({ name: 'click_count', type: 'int', default: 0 })
  clickCount: number;

  @Column({ name: 'unsubscribed_at', type: 'timestamp', nullable: true })
  unsubscribedAt: Date | null;

  @Column({ name: 'bounced_at', type: 'timestamp', nullable: true })
  bouncedAt: Date | null;

  @Column({ name: 'bounce_type', type: 'varchar', nullable: true })
  bounceType: string | null;

  @Column({ name: 'message_id', type: 'varchar', nullable: true })
  messageId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MarketingEmail)
  @JoinColumn({ name: 'email_id' })
  email: MarketingEmail;
}
