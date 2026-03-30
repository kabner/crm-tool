import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
@Index('IDX_notifications_user_unread', ['tenantId', 'userId', 'readAt', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ name: 'action_url', type: 'varchar', nullable: true })
  actionUrl: string | null;

  @Column({ name: 'resource_type', type: 'varchar', nullable: true })
  resourceType: string | null;

  @Column({ name: 'resource_id', type: 'varchar', nullable: true })
  resourceId: string | null;

  @Column({ name: 'actor_id', type: 'varchar', nullable: true })
  actorId: string | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
