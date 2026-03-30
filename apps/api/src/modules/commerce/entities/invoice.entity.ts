import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('invoices')
@Index('IDX_invoices_tenant_status', ['tenantId', 'status'])
@Index('IDX_invoices_tenant_contact', ['tenantId', 'contactId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar' })
  number: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ name: 'issue_date', type: 'timestamp' })
  issueDate: Date;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  @Column({ name: 'payment_terms', type: 'varchar', nullable: true })
  paymentTerms: string;

  @Column({ type: 'integer', default: 0 })
  subtotal: number;

  @Column({ name: 'discount_total', type: 'integer', default: 0 })
  discountTotal: number;

  @Column({ name: 'tax_total', type: 'integer', default: 0 })
  taxTotal: number;

  @Column({ type: 'integer', default: 0 })
  total: number;

  @Column({ name: 'amount_paid', type: 'integer', default: 0 })
  amountPaid: number;

  @Column({ name: 'amount_due', type: 'integer', default: 0 })
  amountDue: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  footer: string;

  @Column({ name: 'pdf_url', type: 'varchar', nullable: true })
  pdfUrl: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'viewed_at', type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
