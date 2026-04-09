import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';

@Entity('pipeline_fields')
@Unique(['pipelineId', 'fieldKey'])
@Index('idx_pipeline_fields_pipeline', ['pipelineId', 'position'])
export class PipelineField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @Column()
  name: string;

  @Column({ name: 'field_key' })
  fieldKey: string;

  @Column({ name: 'field_type', default: 'text' })
  fieldType: string;

  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;

  @Column({ default: false })
  required: boolean;

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Pipeline)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;
}
