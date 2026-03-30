import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar' })
  method: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ name: 'failure_reason', type: 'varchar', nullable: true })
  failureReason: string;

  @Column({ name: 'refunded_amount', type: 'integer', default: 0 })
  refundedAmount: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
