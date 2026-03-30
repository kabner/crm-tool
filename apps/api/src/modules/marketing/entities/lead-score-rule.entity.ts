import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LeadScoreModel } from './lead-score-model.entity';

@Entity('lead_score_rules')
export class LeadScoreRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'model_id', type: 'uuid' })
  modelId: string;

  @Column()
  type: string;

  @Column()
  attribute: string;

  @Column({ type: 'jsonb' })
  condition: Record<string, any>;

  @Column({ type: 'int' })
  points: number;

  @Column({ name: 'decay_per_day', type: 'decimal', default: 0 })
  decayPerDay: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => LeadScoreModel)
  @JoinColumn({ name: 'model_id' })
  model: LeadScoreModel;
}
