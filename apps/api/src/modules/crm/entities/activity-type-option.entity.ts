import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

@Entity('activity_type_options')
@Unique(['tenantId', 'slug'])
@Index('idx_activity_type_options_tenant', ['tenantId', 'position'])
export class ActivityTypeOption {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tenant_id' }) tenantId: string;
  @Column() name: string;
  @Column() slug: string;
  @Column({ default: 'circle' }) icon: string;
  @Column({ default: 'gray' }) color: string;
  @Column({ name: 'is_interaction', default: true }) isInteraction: boolean;
  @Column({ name: 'is_system', default: false }) isSystem: boolean;
  @Column({ default: 0 }) position: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
