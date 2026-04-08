import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDateString,
  IsArray,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDealDto {
  @ApiProperty({ description: 'Deal name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Deal monetary amount' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ description: 'Stage ID', format: 'uuid' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ description: 'Pipeline ID', format: 'uuid' })
  @IsUUID()
  pipelineId: string;

  @ApiPropertyOptional({ description: 'Expected close date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @ApiPropertyOptional({ description: 'Owner user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Associated company ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Associated contact IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  contactIds?: string[];

  @ApiPropertyOptional({ description: 'Reason the deal was lost' })
  @IsOptional()
  @IsString()
  lostReason?: string;

  @ApiPropertyOptional({
    description: 'Custom properties as key-value pairs',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  customProps?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Deal priority', enum: ['none', 'low', 'medium', 'high'] })
  @IsOptional()
  @IsString()
  @IsIn(['none', 'low', 'medium', 'high'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Record visibility', enum: ['everyone', 'owner', 'private'] })
  @IsOptional()
  @IsString()
  @IsIn(['everyone', 'owner', 'private'])
  visibility?: string;
}
