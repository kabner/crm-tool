import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('contacts')
@Index('IDX_contacts_tenant_email', ['tenantId', 'email'])
@Index('IDX_contacts_tenant_name', ['tenantId', 'lastName', 'firstName'])
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle: string;

  @Column({ name: 'lifecycle_stage', default: 'lead' })
  lifecycleStage: string;

  @Column({ name: 'lead_status', nullable: true })
  leadStatus: string;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
