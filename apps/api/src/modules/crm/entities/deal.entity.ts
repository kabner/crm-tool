import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Pipeline } from './pipeline.entity';
import { DealStage } from './deal-stage.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', nullable: true })
  amount: number;

  @Column({ name: 'stage_id' })
  stageId: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @Column({ name: 'close_date', type: 'date', nullable: true })
  closeDate: Date;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ type: 'boolean', nullable: true })
  won: boolean | null;

  @Column({ name: 'lost_reason', nullable: true })
  lostReason: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ name: 'last_stage_change_at', type: 'timestamptz', nullable: true })
  lastStageChangeAt: Date;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date;

  @Column({ default: 'none' })
  priority: string;

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DealStage)
  @JoinColumn({ name: 'stage_id' })
  stage: DealStage;

  @ManyToOne(() => Pipeline)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
