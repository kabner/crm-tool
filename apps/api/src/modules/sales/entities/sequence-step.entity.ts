import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sequence } from './sequence.entity';

@Entity('sequence_steps')
export class SequenceStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_id', type: 'uuid' })
  sequenceId: string;

  @Column({ type: 'int' })
  position: number;

  @Column()
  type: string;

  @Column({ name: 'delay_days', type: 'int', default: 0 })
  delayDays: number;

  @Column({ name: 'delay_hours', type: 'int', default: 0 })
  delayHours: number;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @ManyToOne(() => Sequence)
  @JoinColumn({ name: 'sequence_id' })
  sequence: Sequence;
}
