import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

export class ActivityFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by activity type',
    enum: ['note', 'task', 'call', 'email', 'meeting'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['note', 'task', 'call', 'email', 'meeting'])
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by deal ID' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter tasks by completion status' })
  @IsOptional()
  @Type(() => Boolean)
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Filter activities due before this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueBefore?: string;

  @ApiPropertyOptional({ description: 'Filter activities due after this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueAfter?: string;
}
