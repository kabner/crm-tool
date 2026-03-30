import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ type: 'jsonb', default: '[]' })
  layout: any[];

  @Column({ name: 'default_date_range', type: 'varchar', nullable: true })
  defaultDateRange: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'shared_with', type: 'jsonb', default: '[]' })
  sharedWith: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
