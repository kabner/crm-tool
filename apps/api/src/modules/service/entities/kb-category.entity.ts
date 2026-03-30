import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { KBSection } from './kb-section.entity';

@Entity('kb_categories')
@Index('IDX_kb_categories_tenant', ['tenantId'])
export class KBCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  icon: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'varchar', default: 'public' })
  visibility: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => KBSection, (section) => section.category)
  sections: KBSection[];
}
