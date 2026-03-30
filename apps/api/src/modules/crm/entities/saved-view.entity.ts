import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('saved_views')
export class SavedView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'object_type' })
  objectType: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: '{}' })
  filters: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  columns: any[];

  @Column({ type: 'jsonb', default: '{}' })
  sort: Record<string, any>;

  @Column({ name: 'view_type' })
  viewType: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
