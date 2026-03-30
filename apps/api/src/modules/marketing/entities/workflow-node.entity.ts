import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_nodes')
export class WorkflowNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @Column({ name: 'position_x', type: 'int', default: 0 })
  positionX: number;

  @Column({ name: 'position_y', type: 'int', default: 0 })
  positionY: number;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;
}
