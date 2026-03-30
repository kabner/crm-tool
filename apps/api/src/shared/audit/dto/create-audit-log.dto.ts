export class CreateAuditLogDto {
  tenantId: string;
  userId?: string;
  action: string; // 'create' | 'update' | 'delete' | 'login' | 'export'
  resourceType: string; // 'contact' | 'company' | 'deal' | etc.
  resourceId?: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}
