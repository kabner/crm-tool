import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';

@Entity('activities')
@Index('IDX_activities_tenant_contact_created', [
  'tenantId',
  'contactId',
  'createdAt',
])
@Index('IDX_activities_tenant_company_created', [
  'tenantId',
  'companyId',
  'createdAt',
])
@Index('IDX_activities_tenant_deal_created', [
  'tenantId',
  'dealId',
  'createdAt',
])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  type: string;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ name: 'contact_id', nullable: true })
  contactId: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'deal_id', nullable: true })
  dealId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Deal)
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;

  @ManyToOne(() => Activity, (activity) => activity.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Activity;

  @OneToMany(() => Activity, (activity) => activity.parent)
  children: Activity[];
}
