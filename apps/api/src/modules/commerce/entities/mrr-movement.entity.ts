import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('mrr_movements')
export class MRRMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ name: 'effective_date', type: 'timestamp' })
  effectiveDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
