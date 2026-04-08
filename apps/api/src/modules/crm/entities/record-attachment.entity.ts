import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('record_attachments')
@Index('idx_record_attachments_entity', ['entityType', 'entityId'])
export class RecordAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_size', default: 0 })
  fileSize: number;

  @Column({ name: 'mime_type', default: 'application/octet-stream' })
  mimeType: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'uploaded_by_id', nullable: true })
  uploadedById: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;
}
