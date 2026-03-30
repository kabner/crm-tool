import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';

@Entity('deal_stages')
export class DealStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @Column()
  name: string;

  @Column()
  position: number;

  @Column({ type: 'numeric', default: 0 })
  probability: number;

  @Column({ name: 'stage_type', default: 'open' })
  stageType: string;

  @Column({ name: 'required_fields', type: 'text', array: true, default: '{}' })
  requiredFields: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;
}
