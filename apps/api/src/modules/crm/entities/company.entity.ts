import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
@Index('IDX_companies_tenant_domain', ['tenantId', 'domain'])
@Index('IDX_companies_tenant_name', ['tenantId', 'name'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  size: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'jsonb', nullable: true })
  address: Record<string, any>;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Company, (company) => company.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Company;

  @OneToMany(() => Company, (company) => company.parent)
  children: Company[];
}
