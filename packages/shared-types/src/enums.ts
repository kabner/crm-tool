export type LifecycleStage =
  | 'subscriber'
  | 'lead'
  | 'mql'
  | 'sql'
  | 'opportunity'
  | 'customer'
  | 'evangelist';

export type LeadStatus =
  | 'new'
  | 'attempting_contact'
  | 'connected'
  | 'qualified'
  | 'unqualified';

export type ActivityType = 'note' | 'task' | 'call' | 'email' | 'meeting';

export type CompanySize =
  | 'sole_proprietor'
  | '2_10'
  | '11_50'
  | '51_200'
  | '201_500'
  | '501_1000'
  | '1001_5000'
  | '5001_10000'
  | '10001_plus';

export type TicketStatus =
  | 'new'
  | 'open'
  | 'pending'
  | 'on_hold'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low';

export type DealStageType = 'open' | 'won' | 'lost';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'sales_manager'
  | 'sales_rep'
  | 'marketing_manager'
  | 'marketing_user'
  | 'service_manager'
  | 'service_agent'
  | 'content_editor'
  | 'viewer';
