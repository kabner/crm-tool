import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({
    description: 'Activity type',
    enum: ['note', 'task', 'call', 'email', 'meeting'],
  })
  @IsString()
  @IsIn(['note', 'task', 'call', 'email', 'meeting'])
  type: string;

  @ApiProperty({ description: 'Activity subject' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'Activity body / notes' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ description: 'Associated contact ID' })
  @IsUUID()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Associated company ID' })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Associated deal ID' })
  @IsUUID()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
