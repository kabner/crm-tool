import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sla_policies')
export class SLAPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb' })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb' })
  targets: Record<string, any>;

  @Column({ name: 'business_hours_id', type: 'uuid', nullable: true })
  businessHoursId: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
