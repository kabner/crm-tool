import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('subscription_items')
export class SubscriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'price_id' })
  priceId: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;
}
