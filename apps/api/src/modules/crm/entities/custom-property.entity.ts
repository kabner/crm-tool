import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('custom_properties')
@Index('UQ_custom_properties_tenant_object_name', ['tenantId', 'objectType', 'name'], {
  unique: true,
})
export class CustomProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'object_type' })
  objectType: string;

  @Column()
  name: string;

  @Column()
  label: string;

  @Column({ name: 'field_type' })
  fieldType: string;

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, any>;

  @Column({ name: 'group', nullable: true })
  group: string;

  @Column({ default: false })
  required: boolean;

  @Column({ name: 'default_value', nullable: true })
  defaultValue: string;

  @Column({ default: 0 })
  position: number;

  @Column({ default: false })
  archived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
