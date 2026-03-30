import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column()
  type: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'trigger_type' })
  triggerType: string;

  @Column({ name: 'trigger_id', type: 'varchar', nullable: true })
  triggerId: string | null;

  @Column({ name: 'responded_at', type: 'timestamp' })
  respondedAt: Date;
}
