import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LeadScoreModel } from './lead-score-model.entity';

@Entity('lead_scores')
@Index('UQ_lead_scores_contact_model', ['contactId', 'modelId'], { unique: true })
export class LeadScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'model_id', type: 'uuid' })
  modelId: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ name: 'last_calculated_at', type: 'timestamp' })
  lastCalculatedAt: Date;

  @Column({ name: 'score_breakdown', type: 'jsonb', default: '{}' })
  scoreBreakdown: Record<string, any>;

  @ManyToOne(() => LeadScoreModel)
  @JoinColumn({ name: 'model_id' })
  model: LeadScoreModel;
}
