import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('page_views')
export class PageView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId: string | null;

  @Column({ name: 'page_url' })
  pageUrl: string;

  @Column({ name: 'page_title', type: 'varchar', nullable: true })
  pageTitle: string | null;

  @Column({ type: 'varchar', nullable: true })
  referrer: string | null;

  @Column({ name: 'utm_source', type: 'varchar', nullable: true })
  utmSource: string | null;

  @Column({ name: 'utm_medium', type: 'varchar', nullable: true })
  utmMedium: string | null;

  @Column({ name: 'utm_campaign', type: 'varchar', nullable: true })
  utmCampaign: string | null;

  @Column({ name: 'utm_content', type: 'varchar', nullable: true })
  utmContent: string | null;

  @Column({ name: 'utm_term', type: 'varchar', nullable: true })
  utmTerm: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ name: 'viewed_at', type: 'timestamp' })
  viewedAt: Date;
}
