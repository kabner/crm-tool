import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowNode } from './workflow-node.entity';

@Entity('workflow_edges')
export class WorkflowEdge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @Column({ name: 'from_node_id', type: 'uuid' })
  fromNodeId: string;

  @Column({ name: 'to_node_id', type: 'uuid' })
  toNodeId: string;

  @Column({ name: 'condition_branch', type: 'varchar', nullable: true })
  conditionBranch: string | null;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'from_node_id' })
  fromNode: WorkflowNode;

  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'to_node_id' })
  toNode: WorkflowNode;
}
