import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

export class DealFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by deal name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by pipeline ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Filter by stage ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by company ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Minimum deal amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum deal amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Close date after (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  closeDateAfter?: string;

  @ApiPropertyOptional({ description: 'Close date before (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  closeDateBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter by won status',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  won?: string;
}
