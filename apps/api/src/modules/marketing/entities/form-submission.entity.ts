import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Form } from './form.entity';

@Entity('form_submissions')
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'form_id', type: 'uuid' })
  formId: string;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ name: 'page_url', type: 'varchar', nullable: true })
  pageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  referrer: string | null;

  @Column({ name: 'utm_params', type: 'jsonb', nullable: true })
  utmParams: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  @Column({ name: 'consent_given', type: 'boolean', default: false })
  consentGiven: boolean;

  @ManyToOne(() => Form)
  @JoinColumn({ name: 'form_id' })
  form: Form;
}
