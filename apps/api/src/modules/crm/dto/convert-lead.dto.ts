import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertLeadDto {
  @ApiPropertyOptional({ description: 'Also create a deal' })
  @IsBoolean()
  @IsOptional()
  createDeal?: boolean;

  @ApiPropertyOptional({ description: 'Pipeline ID (required if createDeal is true)' })
  @IsUUID()
  @IsOptional()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Stage ID (required if createDeal is true)' })
  @IsUUID()
  @IsOptional()
  stageId?: string;

  @ApiPropertyOptional({ description: 'Deal name' })
  @IsString()
  @IsOptional()
  dealName?: string;

  @ApiPropertyOptional({ description: 'Deal amount' })
  @IsNumber()
  @IsOptional()
  dealAmount?: number;

  @ApiPropertyOptional({ description: 'Existing company ID to use instead of auto-creating' })
  @IsUUID()
  @IsOptional()
  companyId?: string;
}
