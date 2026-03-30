import type {
  ActivityType,
  CompanySize,
  LeadStatus,
  LifecycleStage,
} from './enums';

// --- Contact ---

export interface ContactDto {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  lifecycleStage: LifecycleStage;
  leadStatus?: LeadStatus;
  ownerId?: string;
  companyIds: string[];
  tags: string[];
  customProps: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CreateContactDto = Omit<
  ContactDto,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'companyIds'
> & {
  companyIds?: string[];
};

export type UpdateContactDto = Partial<CreateContactDto>;

// --- Company ---

export interface AddressDto {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface CompanyDto {
  id: string;
  tenantId: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: CompanySize;
  phone?: string;
  address?: AddressDto;
  ownerId?: string;
  parentId?: string;
  customProps: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CreateCompanyDto = Omit<
  CompanyDto,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt'
>;

export type UpdateCompanyDto = Partial<CreateCompanyDto>;

// --- Deal ---

export interface DealDto {
  id: string;
  tenantId: string;
  name: string;
  amount?: number;
  stageId: string;
  pipelineId: string;
  closeDate?: string;
  ownerId?: string;
  contactIds: string[];
  companyId?: string;
  won?: boolean;
  lostReason?: string;
  customProps: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CreateDealDto = Omit<
  DealDto,
  'id' | 'tenantId' | 'createdAt' | 'updatedAt'
>;

export type UpdateDealDto = Partial<CreateDealDto>;

// --- Activity ---

export interface ActivityDto {
  id: string;
  tenantId: string;
  type: ActivityType;
  subject: string;
  body?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  userId: string;
  dueDate?: string;
  completedAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export type CreateActivityDto = Omit<
  ActivityDto,
  'id' | 'tenantId' | 'createdAt'
>;

export type UpdateActivityDto = Partial<CreateActivityDto>;
