# CRM Platform — Complete Database Schema
# =========================================
# Generated from TypeORM entity definitions
# 72 entities across 10 modules
# Total entities found: 72


================================================================================
  CRM CORE MODULE (16 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: activities
-- Source: apps/api/src/modules/crm/entities/activity.entity.ts
--------------------------------------------------------------------------------

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
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Company } from './company.entity';
import { Deal } from './deal.entity';

@Entity('activities')
@Index('IDX_activities_tenant_contact_created', [
  'tenantId',
  'contactId',
  'createdAt',
])
@Index('IDX_activities_tenant_company_created', [
  'tenantId',
  'companyId',
  'createdAt',
])
@Index('IDX_activities_tenant_deal_created', [
  'tenantId',
  'dealId',
  'createdAt',
])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  type: string;

  @Column()
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ name: 'contact_id', nullable: true })
  contactId: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ name: 'deal_id', nullable: true })
  dealId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'due_date', nullable: true })
  dueDate: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Deal)
  @JoinColumn({ name: 'deal_id' })
  deal: Deal;
}


--------------------------------------------------------------------------------
-- Table: companies
-- Source: apps/api/src/modules/crm/entities/company.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: contact_companies
-- Source: apps/api/src/modules/crm/entities/contact-company.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: contacts
-- Source: apps/api/src/modules/crm/entities/contact.entity.ts
--------------------------------------------------------------------------------

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
import { User } from './user.entity';

@Entity('contacts')
@Index('IDX_contacts_tenant_email', ['tenantId', 'email'])
@Index('IDX_contacts_tenant_name', ['tenantId', 'lastName', 'firstName'])
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'job_title', nullable: true })
  jobTitle: string;

  @Column({ name: 'lifecycle_stage', default: 'lead' })
  lifecycleStage: string;

  @Column({ name: 'lead_status', nullable: true })
  leadStatus: string;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}


--------------------------------------------------------------------------------
-- Table: custom_properties
-- Source: apps/api/src/modules/crm/entities/custom-property.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('custom_properties')
@Index('UQ_custom_properties_tenant_object_name', ['tenantId', 'objectType', 'name'], {
  unique: true,
})
export class CustomProperty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'object_type' })
  objectType: string;

  @Column()
  name: string;

  @Column()
  label: string;

  @Column({ name: 'field_type' })
  fieldType: string;

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, any>;

  @Column({ name: 'group', nullable: true })
  group: string;

  @Column({ default: false })
  required: boolean;

  @Column({ name: 'default_value', nullable: true })
  defaultValue: string;

  @Column({ default: 0 })
  position: number;

  @Column({ default: false })
  archived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


--------------------------------------------------------------------------------
-- Table: deal_stages
-- Source: apps/api/src/modules/crm/entities/deal-stage.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';

@Entity('deal_stages')
export class DealStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @Column()
  name: string;

  @Column()
  position: number;

  @Column({ type: 'numeric', default: 0 })
  probability: number;

  @Column({ name: 'stage_type', default: 'open' })
  stageType: string;

  @Column({ name: 'required_fields', type: 'text', array: true, default: '{}' })
  requiredFields: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Pipeline, (pipeline) => pipeline.stages)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;
}


--------------------------------------------------------------------------------
-- Table: deals
-- Source: apps/api/src/modules/crm/entities/deal.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Pipeline } from './pipeline.entity';
import { DealStage } from './deal-stage.entity';

@Entity('deals')
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', nullable: true })
  amount: number;

  @Column({ name: 'stage_id' })
  stageId: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @Column({ name: 'close_date', type: 'date', nullable: true })
  closeDate: Date;

  @Column({ name: 'owner_id', nullable: true })
  ownerId: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @Column({ type: 'boolean', nullable: true })
  won: boolean | null;

  @Column({ name: 'lost_reason', nullable: true })
  lostReason: string;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @Column({ name: 'last_stage_change_at', type: 'timestamptz', nullable: true })
  lastStageChangeAt: Date;

  @Column({ name: 'last_activity_at', type: 'timestamptz', nullable: true })
  lastActivityAt: Date;

  @Column({ default: 'none', length: 10 })
  priority: string;

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DealStage)
  @JoinColumn({ name: 'stage_id' })
  stage: DealStage;

  @ManyToOne(() => Pipeline)
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}


--------------------------------------------------------------------------------
-- Table: list_memberships
-- Source: apps/api/src/modules/crm/entities/list-membership.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: lists
-- Source: apps/api/src/modules/crm/entities/list.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('lists')
export class List {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}


--------------------------------------------------------------------------------
-- Table: pipelines
-- Source: apps/api/src/modules/crm/entities/pipeline.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DealStage } from './deal-stage.entity';

@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DealStage, (stage) => stage.pipeline)
  stages: DealStage[];
}


--------------------------------------------------------------------------------
-- Table: roles
-- Source: apps/api/src/modules/crm/entities/role.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('roles')
@Index('UQ_roles_tenant_name', ['tenantId', 'name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  permissions: Record<string, any>;

  @Column({ name: 'record_access_level', default: 'own' })
  recordAccessLevel: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}


--------------------------------------------------------------------------------
-- Table: saved_views
-- Source: apps/api/src/modules/crm/entities/saved-view.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('saved_views')
export class SavedView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'object_type' })
  objectType: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: '{}' })
  filters: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  columns: any[];

  @Column({ type: 'jsonb', default: '{}' })
  sort: Record<string, any>;

  @Column({ name: 'view_type' })
  viewType: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


--------------------------------------------------------------------------------
-- Table: sessions
-- Source: apps/api/src/modules/crm/entities/session.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'refresh_token_hash' })
  refreshTokenHash: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_used_at', type: 'timestamp', default: () => 'now()' })
  lastUsedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}


--------------------------------------------------------------------------------
-- Table: tenants
-- Source: apps/api/src/modules/crm/entities/tenant.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ default: 'free' })
  plan: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @Column({ name: 'security_settings', type: 'jsonb', default: '{}' })
  securitySettings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: user_roles
-- Source: apps/api/src/modules/crm/entities/user-role.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index('UQ_user_roles_user_role', ['userId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'role_id' })
  roleId: string;

  @Column({ name: 'granted_at', type: 'timestamp', default: () => 'now()' })
  grantedAt: Date;

  @Column({ name: 'granted_by', nullable: true })
  grantedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}


--------------------------------------------------------------------------------
-- Table: users
-- Source: apps/api/src/modules/crm/entities/user.entity.ts
--------------------------------------------------------------------------------

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
import { Tenant } from './tenant.entity';

@Entity('users')
@Index('UQ_users_tenant_email', ['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}



================================================================================
  MARKETING MODULE (14 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: campaigns
-- Source: apps/api/src/modules/marketing/entities/campaign.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'decimal', nullable: true })
  budget: number | null;

  @Column({ name: 'actual_spend', type: 'decimal', nullable: true })
  actualSpend: number | null;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: email_sends
-- Source: apps/api/src/modules/marketing/entities/email-send.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarketingEmail } from './marketing-email.entity';

@Entity('email_sends')
@Index('IDX_email_sends_tenant_email', ['tenantId', 'emailId'])
@Index('IDX_email_sends_tenant_contact', ['tenantId', 'contactId'])
export class EmailSend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'email_id', type: 'uuid' })
  emailId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ type: 'varchar', nullable: true })
  variant: string | null;

  @Column()
  status: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @Column({ name: 'opened_at', type: 'timestamp', nullable: true })
  openedAt: Date | null;

  @Column({ name: 'open_count', type: 'int', default: 0 })
  openCount: number;

  @Column({ name: 'clicked_at', type: 'timestamp', nullable: true })
  clickedAt: Date | null;

  @Column({ name: 'click_count', type: 'int', default: 0 })
  clickCount: number;

  @Column({ name: 'unsubscribed_at', type: 'timestamp', nullable: true })
  unsubscribedAt: Date | null;

  @Column({ name: 'bounced_at', type: 'timestamp', nullable: true })
  bouncedAt: Date | null;

  @Column({ name: 'bounce_type', type: 'varchar', nullable: true })
  bounceType: string | null;

  @Column({ name: 'message_id', type: 'varchar', nullable: true })
  messageId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => MarketingEmail)
  @JoinColumn({ name: 'email_id' })
  email: MarketingEmail;
}


--------------------------------------------------------------------------------
-- Table: email_templates
-- Source: apps/api/src/modules/marketing/entities/email-template.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ name: 'content_json', type: 'jsonb' })
  contentJson: Record<string, any>;

  @Column({ name: 'content_html', type: 'text' })
  contentHtml: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', nullable: true })
  thumbnailUrl: string | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: form_submissions
-- Source: apps/api/src/modules/marketing/entities/form-submission.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Form } from './form.entity';

@Entity('form_submissions')
export class FormSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'form_id', type: 'uuid' })
  formId: string;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ name: 'page_url', type: 'varchar', nullable: true })
  pageUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  referrer: string | null;

  @Column({ name: 'utm_params', type: 'jsonb', nullable: true })
  utmParams: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  @Column({ name: 'consent_given', type: 'boolean', default: false })
  consentGiven: boolean;

  @ManyToOne(() => Form)
  @JoinColumn({ name: 'form_id' })
  form: Form;
}


--------------------------------------------------------------------------------
-- Table: forms
-- Source: apps/api/src/modules/marketing/entities/form.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ type: 'jsonb' })
  fields: Record<string, any>[];

  @Column({ type: 'jsonb' })
  settings: Record<string, any>;

  @Column({ name: 'embed_code', type: 'text', nullable: true })
  embedCode: string | null;

  @Column({ name: 'submission_count', type: 'int', default: 0 })
  submissionCount: number;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: lead_score_models
-- Source: apps/api/src/modules/marketing/entities/lead-score-model.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('lead_score_models')
export class LeadScoreModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'mql_threshold', type: 'int', default: 50 })
  mqlThreshold: number;

  @Column({ name: 'sql_threshold', type: 'int', default: 80 })
  sqlThreshold: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: lead_score_rules
-- Source: apps/api/src/modules/marketing/entities/lead-score-rule.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LeadScoreModel } from './lead-score-model.entity';

@Entity('lead_score_rules')
export class LeadScoreRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'model_id', type: 'uuid' })
  modelId: string;

  @Column()
  type: string;

  @Column()
  attribute: string;

  @Column({ type: 'jsonb' })
  condition: Record<string, any>;

  @Column({ type: 'int' })
  points: number;

  @Column({ name: 'decay_per_day', type: 'decimal', default: 0 })
  decayPerDay: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => LeadScoreModel)
  @JoinColumn({ name: 'model_id' })
  model: LeadScoreModel;
}


--------------------------------------------------------------------------------
-- Table: lead_scores
-- Source: apps/api/src/modules/marketing/entities/lead-score.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LeadScoreModel } from './lead-score-model.entity';

@Entity('lead_scores')
@Index('UQ_lead_scores_contact_model', ['contactId', 'modelId'], { unique: true })
export class LeadScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'model_id', type: 'uuid' })
  modelId: string;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ name: 'last_calculated_at', type: 'timestamp' })
  lastCalculatedAt: Date;

  @Column({ name: 'score_breakdown', type: 'jsonb', default: '{}' })
  scoreBreakdown: Record<string, any>;

  @ManyToOne(() => LeadScoreModel)
  @JoinColumn({ name: 'model_id' })
  model: LeadScoreModel;
}


--------------------------------------------------------------------------------
-- Table: marketing_emails
-- Source: apps/api/src/modules/marketing/entities/marketing-email.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmailTemplate } from './email-template.entity';

@Entity('marketing_emails')
export class MarketingEmail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column({ name: 'preview_text', type: 'varchar', nullable: true })
  previewText: string | null;

  @Column({ name: 'from_name' })
  fromName: string;

  @Column({ name: 'from_email' })
  fromEmail: string;

  @Column({ name: 'reply_to', type: 'varchar', nullable: true })
  replyTo: string | null;

  @Column({ name: 'content_html', type: 'text' })
  contentHtml: string;

  @Column({ name: 'content_json', type: 'jsonb' })
  contentJson: Record<string, any>;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @Column({ default: 'draft' })
  status: string;

  @Column({ name: 'send_type' })
  sendType: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'ab_test_config', type: 'jsonb', nullable: true })
  abTestConfig: Record<string, any> | null;

  @Column({ name: 'stats_cache', type: 'jsonb', default: '{}' })
  statsCache: Record<string, any>;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => EmailTemplate)
  @JoinColumn({ name: 'template_id' })
  template: EmailTemplate;
}


--------------------------------------------------------------------------------
-- Table: page_views
-- Source: apps/api/src/modules/marketing/entities/page-view.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: workflow_edges
-- Source: apps/api/src/modules/marketing/entities/workflow-edge.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowNode } from './workflow-node.entity';

@Entity('workflow_edges')
export class WorkflowEdge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @Column({ name: 'from_node_id', type: 'uuid' })
  fromNodeId: string;

  @Column({ name: 'to_node_id', type: 'uuid' })
  toNodeId: string;

  @Column({ name: 'condition_branch', type: 'varchar', nullable: true })
  conditionBranch: string | null;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;

  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'from_node_id' })
  fromNode: WorkflowNode;

  @ManyToOne(() => WorkflowNode)
  @JoinColumn({ name: 'to_node_id' })
  toNode: WorkflowNode;
}


--------------------------------------------------------------------------------
-- Table: workflow_enrollments
-- Source: apps/api/src/modules/marketing/entities/workflow-enrollment.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_enrollments')
export class WorkflowEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'current_node_id', type: 'uuid', nullable: true })
  currentNodeId: string | null;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'enrolled_at', type: 'timestamp' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'next_action_at', type: 'timestamp', nullable: true })
  nextActionAt: Date | null;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;
}


--------------------------------------------------------------------------------
-- Table: workflow_nodes
-- Source: apps/api/src/modules/marketing/entities/workflow-node.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';

@Entity('workflow_nodes')
export class WorkflowNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_id', type: 'uuid' })
  workflowId: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @Column({ name: 'position_x', type: 'int', default: 0 })
  positionX: number;

  @Column({ name: 'position_y', type: 'int', default: 0 })
  positionY: number;

  @ManyToOne(() => Workflow)
  @JoinColumn({ name: 'workflow_id' })
  workflow: Workflow;
}


--------------------------------------------------------------------------------
-- Table: workflows
-- Source: apps/api/src/modules/marketing/entities/workflow.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ default: 'draft' })
  status: string;

  @Column({ name: 'trigger_config', type: 'jsonb' })
  triggerConfig: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'stats_cache', type: 'jsonb', default: '{}' })
  statsCache: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



================================================================================
  SERVICE MODULE (12 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: business_hours
-- Source: apps/api/src/modules/service/entities/business-hours.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('business_hours')
export class BusinessHours {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'UTC' })
  timezone: string;

  @Column({ type: 'jsonb' })
  schedule: { day: string; start: string; end: string }[];

  @Column({ type: 'jsonb' })
  holidays: { date: string; name: string }[];
}


--------------------------------------------------------------------------------
-- Table: chat_messages
-- Source: apps/api/src/modules/service/entities/chat-message.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'sender_type' })
  senderType: string;

  @Column({ name: 'sender_id', type: 'varchar', nullable: true })
  senderId: string | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', default: '[]' })
  attachments: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatSession)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;
}


--------------------------------------------------------------------------------
-- Table: chat_sessions
-- Source: apps/api/src/modules/service/entities/chat-session.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @Column({ name: 'agent_id', type: 'uuid', nullable: true })
  agentId: string | null;

  @Column({ default: 'waiting' })
  status: string;

  @Column({ default: 'web_chat' })
  channel: string;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'first_response_at', type: 'timestamp', nullable: true })
  firstResponseAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId: string | null;

  @Column({ type: 'varchar', nullable: true })
  satisfaction: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}


--------------------------------------------------------------------------------
-- Table: kb_articles
-- Source: apps/api/src/modules/service/entities/kb-article.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: kb_categories
-- Source: apps/api/src/modules/service/entities/kb-category.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: kb_sections
-- Source: apps/api/src/modules/service/entities/kb-section.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: sla_policies
-- Source: apps/api/src/modules/service/entities/sla-policy.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sla_policies')
export class SLAPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb' })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb' })
  targets: Record<string, any>;

  @Column({ name: 'business_hours_id', type: 'uuid', nullable: true })
  businessHoursId: string | null;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


--------------------------------------------------------------------------------
-- Table: survey_responses
-- Source: apps/api/src/modules/service/entities/survey-response.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column()
  type: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ name: 'trigger_type' })
  triggerType: string;

  @Column({ name: 'trigger_id', type: 'varchar', nullable: true })
  triggerId: string | null;

  @Column({ name: 'responded_at', type: 'timestamp' })
  respondedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: ticket_categories
-- Source: apps/api/src/modules/service/entities/ticket-category.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('ticket_categories')
export class TicketCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => TicketCategory)
  @JoinColumn({ name: 'parent_id' })
  parent: TicketCategory;
}


--------------------------------------------------------------------------------
-- Table: ticket_macros
-- Source: apps/api/src/modules/service/entities/ticket-macro.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('ticket_macros')
export class TicketMacro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  actions: { type: string; value: any }[];

  @Column({ default: 'personal' })
  visibility: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;
}


--------------------------------------------------------------------------------
-- Table: ticket_messages
-- Source: apps/api/src/modules/service/entities/ticket-message.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('ticket_messages')
export class TicketMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId: string;

  @Column({ default: 'reply' })
  type: string;

  @Column()
  direction: string;

  @Column({ name: 'from_contact', type: 'boolean', default: false })
  fromContact: boolean;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'body_html', type: 'text' })
  bodyHtml: string;

  @Column({ name: 'body_text', type: 'text', nullable: true })
  bodyText: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  attachments: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}


--------------------------------------------------------------------------------
-- Table: tickets
-- Source: apps/api/src/modules/service/entities/ticket.entity.ts
--------------------------------------------------------------------------------

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
import { TicketCategory } from './ticket-category.entity';

@Entity('tickets')
@Index('IDX_tickets_tenant_status', ['tenantId', 'status'])
@Index('IDX_tickets_tenant_assigned_to', ['tenantId', 'assignedTo'])
@Index('IDX_tickets_tenant_contact', ['tenantId', 'contactId'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  number: string;

  @Column()
  subject: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ default: 'normal' })
  priority: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ name: 'assigned_team', type: 'varchar', nullable: true })
  assignedTeam: string | null;

  @Column({ default: 'email' })
  channel: string;

  @Column({ name: 'sla_policy_id', type: 'uuid', nullable: true })
  slaPolicyId: string | null;

  @Column({ name: 'first_response_at', type: 'timestamp', nullable: true })
  firstResponseAt: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'sla_first_response_due', type: 'timestamp', nullable: true })
  slaFirstResponseDue: Date | null;

  @Column({ name: 'sla_resolution_due', type: 'timestamp', nullable: true })
  slaResolutionDue: Date | null;

  @Column({ name: 'sla_breached', type: 'boolean', default: false })
  slaBreached: boolean;

  @Column({ name: 'sla_paused_at', type: 'timestamp', nullable: true })
  slaPausedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  satisfaction: string | null;

  @Column({ name: 'satisfaction_comment', type: 'text', nullable: true })
  satisfactionComment: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @Column({ name: 'source_data', type: 'jsonb', nullable: true })
  sourceData: Record<string, any> | null;

  @Column({ name: 'parent_ticket_id', type: 'uuid', nullable: true })
  parentTicketId: string | null;

  @Column({ name: 'merged_into_id', type: 'uuid', nullable: true })
  mergedIntoId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => TicketCategory)
  @JoinColumn({ name: 'category_id' })
  category: TicketCategory;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'parent_ticket_id' })
  parentTicket: Ticket;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'merged_into_id' })
  mergedInto: Ticket;
}



================================================================================
  CONTENT MODULE (7 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: asset_folders
-- Source: apps/api/src/modules/content/entities/asset-folder.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('asset_folders')
export class AssetFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @ManyToOne(() => AssetFolder)
  @JoinColumn({ name: 'parent_id' })
  parent: AssetFolder;
}


--------------------------------------------------------------------------------
-- Table: assets
-- Source: apps/api/src/modules/content/entities/asset.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssetFolder } from './asset-folder.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  filename: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @Column({ name: 's3_key' })
  s3Key: string;

  @Column({ name: 'cdn_url', type: 'varchar', nullable: true })
  cdnUrl: string | null;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ name: 'alt_text', type: 'varchar', nullable: true })
  altText: string | null;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  thumbnails: Record<string, any>;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => AssetFolder)
  @JoinColumn({ name: 'folder_id' })
  folder: AssetFolder;
}


--------------------------------------------------------------------------------
-- Table: content_categories
-- Source: apps/api/src/modules/content/entities/content-category.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('content_categories')
export class ContentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column()
  type: string;

  @ManyToOne(() => ContentCategory)
  @JoinColumn({ name: 'parent_id' })
  parent: ContentCategory;
}


--------------------------------------------------------------------------------
-- Table: content_pages
-- Source: apps/api/src/modules/content/entities/content-page.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: content_versions
-- Source: apps/api/src/modules/content/entities/content-version.entity.ts
--------------------------------------------------------------------------------

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


--------------------------------------------------------------------------------
-- Table: redirects
-- Source: apps/api/src/modules/content/entities/redirect.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('redirects')
export class Redirect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'from_path' })
  fromPath: string;

  @Column({ name: 'to_path' })
  toPath: string;

  @Column({ type: 'int', default: 301 })
  type: number;

  @Column({ name: 'hit_count', type: 'int', default: 0 })
  hitCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


--------------------------------------------------------------------------------
-- Table: site_themes
-- Source: apps/api/src/modules/content/entities/site-theme.entity.ts
--------------------------------------------------------------------------------

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



================================================================================
  SALES MODULE (3 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: sequence_enrollments
-- Source: apps/api/src/modules/sales/entities/sequence-enrollment.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sequence } from './sequence.entity';

@Entity('sequence_enrollments')
export class SequenceEnrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_id', type: 'uuid' })
  sequenceId: string;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @Column({ name: 'enrolled_by', type: 'uuid' })
  enrolledBy: string;

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'enrolled_at', type: 'timestamp' })
  enrolledAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'exit_reason', type: 'varchar', nullable: true })
  exitReason: string | null;

  @ManyToOne(() => Sequence)
  @JoinColumn({ name: 'sequence_id' })
  sequence: Sequence;
}


--------------------------------------------------------------------------------
-- Table: sequence_steps
-- Source: apps/api/src/modules/sales/entities/sequence-step.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sequence } from './sequence.entity';

@Entity('sequence_steps')
export class SequenceStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_id', type: 'uuid' })
  sequenceId: string;

  @Column({ type: 'int' })
  position: number;

  @Column()
  type: string;

  @Column({ name: 'delay_days', type: 'int', default: 0 })
  delayDays: number;

  @Column({ name: 'delay_hours', type: 'int', default: 0 })
  delayHours: number;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @ManyToOne(() => Sequence)
  @JoinColumn({ name: 'sequence_id' })
  sequence: Sequence;
}


--------------------------------------------------------------------------------
-- Table: sequences
-- Source: apps/api/src/modules/sales/entities/sequence.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sequences')
export class Sequence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'draft' })
  status: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @Column({ name: 'stats_cache', type: 'jsonb', default: '{}' })
  statsCache: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



================================================================================
  COMMERCE MODULE (11 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: billing_profiles
-- Source: apps/api/src/modules/commerce/entities/billing-profile.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('billing_profiles')
export class BillingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ name: 'billing_email', type: 'varchar', nullable: true })
  billingEmail: string;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: Record<string, any>;

  @Column({ name: 'tax_id', type: 'varchar', nullable: true })
  taxId: string;

  @Column({ name: 'default_payment_terms', type: 'varchar', nullable: true })
  defaultPaymentTerms: string;

  @Column({ name: 'default_currency', type: 'varchar', default: 'USD' })
  defaultCurrency: string;

  @Column({ name: 'payment_methods', type: 'jsonb', default: '[]' })
  paymentMethods: any[];
}


--------------------------------------------------------------------------------
-- Table: invoice_line_items
-- Source: apps/api/src/modules/commerce/entities/invoice-line-item.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_line_items')
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice: number;

  @Column({ name: 'discount_pct', type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountPct: number;

  @Column({ name: 'tax_rate_id', type: 'uuid', nullable: true })
  taxRateId: string;

  @Column({ type: 'integer' })
  total: number;

  @Column({ name: 'period_start', type: 'timestamp', nullable: true })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'timestamp', nullable: true })
  periodEnd: Date;

  @Column({ type: 'integer', default: 0 })
  position: number;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}


--------------------------------------------------------------------------------
-- Table: invoices
-- Source: apps/api/src/modules/commerce/entities/invoice.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('invoices')
@Index('IDX_invoices_tenant_status', ['tenantId', 'status'])
@Index('IDX_invoices_tenant_contact', ['tenantId', 'contactId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar' })
  number: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: string;

  @Column({ name: 'issue_date', type: 'timestamp' })
  issueDate: Date;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date;

  @Column({ name: 'payment_terms', type: 'varchar', nullable: true })
  paymentTerms: string;

  @Column({ type: 'integer', default: 0 })
  subtotal: number;

  @Column({ name: 'discount_total', type: 'integer', default: 0 })
  discountTotal: number;

  @Column({ name: 'tax_total', type: 'integer', default: 0 })
  taxTotal: number;

  @Column({ type: 'integer', default: 0 })
  total: number;

  @Column({ name: 'amount_paid', type: 'integer', default: 0 })
  amountPaid: number;

  @Column({ name: 'amount_due', type: 'integer', default: 0 })
  amountDue: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  footer: string;

  @Column({ name: 'pdf_url', type: 'varchar', nullable: true })
  pdfUrl: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'viewed_at', type: 'timestamp', nullable: true })
  viewedAt: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: Record<string, any>;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: mrr_movements
-- Source: apps/api/src/modules/commerce/entities/mrr-movement.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('mrr_movements')
export class MRRMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ name: 'effective_date', type: 'timestamp' })
  effectiveDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


--------------------------------------------------------------------------------
-- Table: payments
-- Source: apps/api/src/modules/commerce/entities/payment.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar' })
  method: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ name: 'failure_reason', type: 'varchar', nullable: true })
  failureReason: string;

  @Column({ name: 'refunded_amount', type: 'integer', default: 0 })
  refundedAmount: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}


--------------------------------------------------------------------------------
-- Table: price_books
-- Source: apps/api/src/modules/commerce/entities/price-book.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('price_books')
export class PriceBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', nullable: true })
  description: string;
}


--------------------------------------------------------------------------------
-- Table: prices
-- Source: apps/api/src/modules/commerce/entities/price.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('prices')
export class Price {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'varchar', default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  interval: string;

  @Column({ name: 'interval_count', type: 'integer', default: 1 })
  intervalCount: number;

  @Column({ name: 'trial_days', type: 'integer', default: 0 })
  trialDays: number;

  @Column({ name: 'tier_config', type: 'jsonb', nullable: true })
  tierConfig: Record<string, any>;

  @Column({ name: 'price_book_id', type: 'uuid', nullable: true })
  priceBookId: string;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}


--------------------------------------------------------------------------------
-- Table: products
-- Source: apps/api/src/modules/commerce/entities/product.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  sku: string;

  @Column({ name: 'category_id', type: 'varchar', nullable: true })
  categoryId: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'image_ids', type: 'text', array: true, default: '{}' })
  imageIds: string[];

  @Column({ name: 'custom_props', type: 'jsonb', default: '{}' })
  customProps: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: subscription_items
-- Source: apps/api/src/modules/commerce/entities/subscription-item.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('subscription_items')
export class SubscriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'price_id' })
  priceId: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;
}


--------------------------------------------------------------------------------
-- Table: subscriptions
-- Source: apps/api/src/modules/commerce/entities/subscription.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ name: 'deal_id', type: 'uuid', nullable: true })
  dealId: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ name: 'trial_start', type: 'timestamp', nullable: true })
  trialStart: Date;

  @Column({ name: 'trial_end', type: 'timestamp', nullable: true })
  trialEnd: Date;

  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'pause_started_at', type: 'timestamp', nullable: true })
  pauseStartedAt: Date | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: tax_rates
-- Source: apps/api/src/modules/commerce/entities/tax-rate.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('tax_rates')
export class TaxRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ type: 'varchar', nullable: true })
  jurisdiction: string;

  @Column({ name: 'is_inclusive', type: 'boolean', default: false })
  isInclusive: boolean;
}



================================================================================
  DATA & ANALYTICS MODULE (3 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: dashboard_widgets
-- Source: apps/api/src/modules/data/entities/dashboard-widget.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dashboard } from './dashboard.entity';

@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dashboard_id' })
  dashboardId: string;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId: string;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ type: 'jsonb' })
  position: Record<string, any>;

  @Column({ name: 'refresh_interval', type: 'integer', nullable: true })
  refreshInterval: number;

  @ManyToOne(() => Dashboard)
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: Dashboard;
}


--------------------------------------------------------------------------------
-- Table: dashboards
-- Source: apps/api/src/modules/data/entities/dashboard.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ type: 'jsonb', default: '[]' })
  layout: any[];

  @Column({ name: 'default_date_range', type: 'varchar', nullable: true })
  defaultDateRange: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'shared_with', type: 'jsonb', default: '[]' })
  sharedWith: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: reports
-- Source: apps/api/src/modules/data/entities/report.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ name: 'data_source', type: 'varchar' })
  dataSource: string;

  @Column({ type: 'jsonb', nullable: true })
  joins: any;

  @Column({ type: 'jsonb', default: '[]' })
  fields: any[];

  @Column({ type: 'jsonb', default: '[]' })
  filters: any[];

  @Column({ name: 'group_by', type: 'jsonb', nullable: true })
  groupBy: any;

  @Column({ type: 'jsonb', nullable: true })
  sort: any;

  @Column({ type: 'jsonb', default: '{}' })
  visualization: Record<string, any>;

  @Column({ name: 'calculated_fields', type: 'jsonb', nullable: true })
  calculatedFields: any;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ name: 'cache_key', type: 'varchar', nullable: true })
  cacheKey: string;

  @Column({ name: 'cache_ttl', type: 'integer', nullable: true })
  cacheTtl: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}



================================================================================
  INTEGRATIONS MODULE (4 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: api_keys
-- Source: apps/api/src/modules/integrations/entities/api-key.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('api_keys')
export class APIKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'key_hash', type: 'varchar' })
  keyHash: string;

  @Column({ name: 'key_prefix', type: 'varchar' })
  keyPrefix: string;

  @Column({ type: 'jsonb', default: '{}' })
  scopes: Record<string, any>;

  @Column({ name: 'rate_limit', type: 'integer', default: 100 })
  rateLimit: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;
}


--------------------------------------------------------------------------------
-- Table: integrations
-- Source: apps/api/src/modules/integrations/entities/integration.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  provider: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'disconnected' })
  status: string;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ name: 'connected_by', type: 'uuid', nullable: true })
  connectedBy: string;

  @Column({ name: 'connected_at', type: 'timestamp', nullable: true })
  connectedAt: Date;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ name: 'error_message', type: 'varchar', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;
}


--------------------------------------------------------------------------------
-- Table: webhook_deliveries
-- Source: apps/api/src/modules/integrations/entities/webhook-delivery.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WebhookEndpoint } from './webhook-endpoint.entity';

@Entity('webhook_deliveries')
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'endpoint_id' })
  endpointId: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  attempts: number;

  @Column({ name: 'last_attempt_at', type: 'timestamp', nullable: true })
  lastAttemptAt: Date;

  @Column({ name: 'response_status', type: 'integer', nullable: true })
  responseStatus: number;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => WebhookEndpoint)
  @JoinColumn({ name: 'endpoint_id' })
  endpoint: WebhookEndpoint;
}


--------------------------------------------------------------------------------
-- Table: webhook_endpoints
-- Source: apps/api/src/modules/integrations/entities/webhook-endpoint.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('webhook_endpoints')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar' })
  secret: string;

  @Column({ type: 'text', array: true })
  events: string[];

  @Column({ name: 'filter_config', type: 'jsonb', nullable: true })
  filterConfig: Record<string, any> | null;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}



================================================================================
  AUDIT (SHARED) MODULE (1 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: audit_logs
-- Source: apps/api/src/shared/audit/entities/audit-log.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column({ name: 'resource_type' })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'occurred_at', type: 'timestamp', default: () => 'now()' })
  occurredAt: Date;
}



================================================================================
  NOTIFICATIONS (SHARED) MODULE (1 entities)
================================================================================

--------------------------------------------------------------------------------
-- Table: notifications
-- Source: apps/api/src/shared/notifications/entities/notification.entity.ts
--------------------------------------------------------------------------------

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('notifications')
@Index('IDX_notifications_user_unread', ['tenantId', 'userId', 'readAt', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  type: string;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ name: 'action_url', type: 'varchar', nullable: true })
  actionUrl: string | null;

  @Column({ name: 'resource_type', type: 'varchar', nullable: true })
  resourceType: string | null;

  @Column({ name: 'resource_id', type: 'varchar', nullable: true })
  resourceId: string | null;

  @Column({ name: 'actor_id', type: 'varchar', nullable: true })
  actorId: string | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

