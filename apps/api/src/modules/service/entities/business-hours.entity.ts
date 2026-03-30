import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('business_hours')
export class BusinessHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb' })
  schedule: { day: string; start: string; end: string }[];

  @Column({ type: 'jsonb' })
  holidays: { date: string; name: string }[];
}
