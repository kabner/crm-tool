import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'jsonb' })
  fields: Record<string, any>[];

  @Column({ type: 'jsonb' })
  settings: Record<string, any>;

  @Column({ name: 'embed_code', type: 'text', nullable: true })
  embedCode: string | null;

  @Column({ name: 'submission_count', type: 'int', default: 0 })
  submissionCount: number;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
