import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('exchange_rates')
@Unique(['tenantId', 'fromCurrency', 'toCurrency'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'from_currency' })
  fromCurrency: string;

  @Column({ name: 'to_currency' })
  toCurrency: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  rate: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
