import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { KBCategory } from './kb-category.entity';
import { KBArticle } from './kb-article.entity';

@Entity('kb_sections')
export class KBSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => KBCategory, (category) => category.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: KBCategory;

  @OneToMany(() => KBArticle, (article) => article.section)
  articles: KBArticle[];
}
