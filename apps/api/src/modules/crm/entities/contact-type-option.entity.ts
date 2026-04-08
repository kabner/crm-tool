import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('contact_type_options')
@Index('idx_contact_type_options_tenant', ['tenantId', 'position'])
export class ContactTypeOption {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tenant_id' }) tenantId: string;
  @Column() name: string;
  @Column({ default: 'gray' }) color: string;
  @Column({ default: 0 }) position: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
