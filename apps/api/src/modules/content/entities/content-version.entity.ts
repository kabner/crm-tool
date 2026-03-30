import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContentPage } from './content-page.entity';

@Entity('content_versions')
export class ContentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'page_id', type: 'uuid' })
  pageId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ name: 'body_json', type: 'jsonb' })
  bodyJson: Record<string, any>;

  @Column()
  title: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @Column({ name: 'change_summary', type: 'varchar', nullable: true })
  changeSummary: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ContentPage)
  @JoinColumn({ name: 'page_id' })
  page: ContentPage;
}
