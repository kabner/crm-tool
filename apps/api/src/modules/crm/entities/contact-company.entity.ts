import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Contact } from './contact.entity';
import { Company } from './company.entity';

@Entity('contact_companies')
@Index('UQ_contact_companies_contact_company', ['contactId', 'companyId'], {
  unique: true,
})
export class ContactCompany {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ nullable: true })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
