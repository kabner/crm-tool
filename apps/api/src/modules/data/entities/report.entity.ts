import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ name: 'data_source', type: 'varchar' })
  dataSource: string;

  @Column({ type: 'jsonb', nullable: true })
  joins: any;

  @Column({ type: 'jsonb', default: '[]' })
  fields: any[];

  @Column({ type: 'jsonb', default: '[]' })
  filters: any[];

  @Column({ name: 'group_by', type: 'jsonb', nullable: true })
  groupBy: any;

  @Column({ type: 'jsonb', nullable: true })
  sort: any;

  @Column({ type: 'jsonb', default: '{}' })
  visualization: Record<string, any>;

  @Column({ name: 'calculated_fields', type: 'jsonb', nullable: true })
  calculatedFields: any;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'cache_key', type: 'varchar', nullable: true })
  cacheKey: string;

  @Column({ name: 'cache_ttl', type: 'integer', nullable: true })
  cacheTtl: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
