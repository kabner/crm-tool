import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_enrollments')
export class WorkflowEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'current_node_id', type: 'uuid', nullable: true })
  currentNodeId: string | null;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'enrolled_at', type: 'timestamp' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'next_action_at', type: 'timestamp', nullable: true })
  nextActionAt: Date | null;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;
}
