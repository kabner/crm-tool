import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_line_items')
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice: number;

  @Column({ name: 'discount_pct', type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountPct: number;

  @Column({ name: 'tax_rate_id', type: 'uuid', nullable: true })
  taxRateId: string;

  @Column({ type: 'integer' })
  total: number;

  @Column({ name: 'period_start', type: 'timestamp', nullable: true })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamp', nullable: true })
  periodEnd: Date;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}
