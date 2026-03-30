import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { List } from './list.entity';
import { Contact } from './contact.entity';

@Entity('list_memberships')
@Index('UQ_list_memberships_list_contact', ['listId', 'contactId'], {
  unique: true,
})
export class ListMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'list_id' })
  listId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'added_at', type: 'timestamp', default: () => 'now()' })
  addedAt: Date;

  @Column({ nullable: true })
  source: string;

  @ManyToOne(() => List)
  @JoinColumn({ name: 'list_id' })
  list: List;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;
}
