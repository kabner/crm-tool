import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('site_themes')
export class SiteTheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @Column({ name: 'header_json', type: 'jsonb', nullable: true })
  headerJson: Record<string, any> | null;

  @Column({ name: 'footer_json', type: 'jsonb', nullable: true })
  footerJson: Record<string, any> | null;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;
}
