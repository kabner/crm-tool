import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('redirects')
export class Redirect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'from_path' })
  fromPath: string;

  @Column({ name: 'to_path' })
  toPath: string;

  @Column({ type: 'int', default: 301 })
  type: number;

  @Column({ name: 'hit_count', type: 'int', default: 0 })
  hitCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
