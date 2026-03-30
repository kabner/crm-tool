import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sequence } from './sequence.entity';

@Entity('sequence_enrollments')
export class SequenceEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_id', type: 'uuid' })
  sequenceId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'enrolled_by', type: 'uuid' })
  enrolledBy: string;

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'enrolled_at', type: 'timestamp' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'exit_reason', type: 'varchar', nullable: true })
  exitReason: string | null;

  @ManyToOne(() => Sequence)
  @JoinColumn({ name: 'sequence_id' })
  sequence: Sequence;
}
