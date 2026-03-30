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

@Entity('content_pages')
@Index('IDX_content_pages_tenant_status_type', ['tenantId', 'status', 'type'])
@Index('IDX_content_pages_tenant_slug', ['tenantId', 'slug'], { unique: true })
export class ContentPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ name: 'body_json', type: 'jsonb' })
  bodyJson: Record<string, any>;

  @Column({ name: 'body_html', type: 'text', nullable: true })
  bodyHtml: string | null;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ name: 'featured_image', type: 'varchar', nullable: true })
  featuredImage: string | null;

  @Column({ default: 'draft' })
  status: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'seo_title', type: 'varchar', nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ name: 'og_image', type: 'varchar', nullable: true })
  ogImage: string | null;

  @Column({ name: 'canonical_url', type: 'varchar', nullable: true })
  canonicalUrl: string | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar', default: 'en' })
  locale: string;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'word_count', type: 'int', default: 0 })
  wordCount: number;

  @Column({ name: 'reading_time_min', type: 'int', default: 0 })
  readingTimeMin: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ContentPage)
  @JoinColumn({ name: 'parent_id' })
  parent: ContentPage;
}
