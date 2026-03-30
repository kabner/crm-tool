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
import { TicketCategory } from './ticket-category.entity';

@Entity('tickets')
@Index('IDX_tickets_tenant_status', ['tenantId', 'status'])
@Index('IDX_tickets_tenant_assigned_to', ['tenantId', 'assignedTo'])
@Index('IDX_tickets_tenant_contact', ['tenantId', 'contactId'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  number: string;

  @Column()
  subject: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ default: 'normal' })
  priority: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ name: 'assigned_team', type: 'varchar', nullable: true })
  assignedTeam: string | null;

  @Column({ default: 'email' })
  channel: string;

  @Column({ name: 'sla_policy_id', type: 'uuid', nullable: true })
  slaPolicyId: string | null;

  @Column({ name: 'first_response_at', type: 'timestamp', nullable: true })
  firstResponseAt: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'sla_first_response_due', type: 'timestamp', nullable: true })
  slaFirstResponseDue: Date | null;

  @Column({ name: 'sla_resolution_due', type: 'timestamp', nullable: true })
  slaResolutionDue: Date | null;

  @Column({ name: 'sla_breached', type: 'boolean', default: false })
  slaBreached: boolean;

  @Column({ name: 'sla_paused_at', type: 'timestamp', nullable: true })
  slaPausedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  satisfaction: string | null;

  @Column({ name: 'satisfaction_comment', type: 'text', nullable: true })
  satisfactionComment: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @Column({ name: 'source_data', type: 'jsonb', nullable: true })
  sourceData: Record<string, any> | null;

  @Column({ name: 'parent_ticket_id', type: 'uuid', nullable: true })
  parentTicketId: string | null;

  @Column({ name: 'merged_into_id', type: 'uuid', nullable: true })
  mergedIntoId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TicketCategory)
  @JoinColumn({ name: 'category_id' })
  category: TicketCategory;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'parent_ticket_id' })
  parentTicket: Ticket;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'merged_into_id' })
  mergedInto: Ticket;
}
