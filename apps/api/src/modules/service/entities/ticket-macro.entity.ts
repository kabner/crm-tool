import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('ticket_macros')
export class TicketMacro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  actions: { type: string; value: any }[];

  @Column({ default: 'personal' })
  visibility: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;
}
