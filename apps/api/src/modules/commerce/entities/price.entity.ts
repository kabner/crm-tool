import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('prices')
export class Price {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  interval: string;

  @Column({ name: 'interval_count', type: 'integer', default: 1 })
  intervalCount: number;

  @Column({ name: 'trial_days', type: 'integer', default: 0 })
  trialDays: number;

  @Column({ name: 'tier_config', type: 'jsonb', nullable: true })
  tierConfig: Record<string, any>;

  @Column({ name: 'price_book_id', type: 'uuid', nullable: true })
  priceBookId: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
