import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { KBSection } from './kb-section.entity';

@Entity('kb_articles')
@Index('IDX_kb_articles_tenant_status', ['tenantId', 'status'])
@Index('IDX_kb_articles_section', ['sectionId'])
export class KBArticle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'section_id', type: 'uuid' })
  sectionId: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ name: 'body_html', type: 'text' })
  bodyHtml: string;

  @Column({ name: 'body_json', type: 'jsonb', nullable: true })
  bodyJson: Record<string, any> | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ type: 'varchar', default: 'public' })
  visibility: string;

  @Column({ name: 'seo_title', type: 'varchar', nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ name: 'helpful_count', type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ name: 'not_helpful_count', type: 'int', default: 0 })
  notHelpfulCount: number;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => KBSection, (section) => section.articles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: KBSection;
}
