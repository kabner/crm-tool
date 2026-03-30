import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('api_keys')
export class APIKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'key_hash', type: 'varchar' })
  keyHash: string;

  @Column({ name: 'key_prefix', type: 'varchar' })
  keyPrefix: string;

  @Column({ type: 'jsonb', default: '{}' })
  scopes: Record<string, any>;

  @Column({ name: 'rate_limit', type: 'integer', default: 100 })
  rateLimit: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;
}
