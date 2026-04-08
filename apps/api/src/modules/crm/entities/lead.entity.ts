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
import { Contact } from './contact.entity';
import { Deal } from './deal.entity';

@Entity('leads')
@Index('idx_leads_tenant_status', ['tenantId', 'status'])
@Index('idx_leads_tenant_email', ['tenantId', 'email'])
export class Lead {
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

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  source: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ type: 'integer', default: 0 })
  score: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @Column({ name: 'converted_at', nullable: true })
  convertedAt: Date;

  @Column({ name: 'converted_contact_id', nullable: true })
  convertedContactId: string;

  @Column({ name: 'converted_deal_id', nullable: true })
  convertedDealId: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'converted_contact_id' })
  convertedContact: Contact;

  @ManyToOne(() => Deal)
  @JoinColumn({ name: 'converted_deal_id' })
  convertedDeal: Deal;
}
