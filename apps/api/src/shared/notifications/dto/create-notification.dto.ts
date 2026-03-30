import { IsString, IsUUID, IsOptional, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  userId: string;

  @IsString()
  @IsIn(['assignment', 'mention', 'task_reminder', 'deal_update', 'ticket_update', 'system'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}
