import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

export class ContactFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Full-text search across name and email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by lifecycle stage' })
  @IsOptional()
  @IsString()
  lifecycleStage?: string;

  @ApiPropertyOptional({ description: 'Filter by lead status' })
  @IsOptional()
  @IsString()
  leadStatus?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ description: 'Filter by associated company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter contacts created after this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({ description: 'Filter contacts created before this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}
