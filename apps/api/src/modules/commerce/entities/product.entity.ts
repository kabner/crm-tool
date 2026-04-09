import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  sku: string;

  @Column({ name: 'category_id', type: 'varchar', nullable: true })
  categoryId: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'image_ids', type: 'text', array: true, default: '{}' })
  imageIds: string[];

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
