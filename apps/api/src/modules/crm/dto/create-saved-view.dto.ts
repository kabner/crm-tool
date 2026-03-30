import {
  IsString,
  IsIn,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SortDto {
  @ApiProperty({ description: 'Field to sort by' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

export class CreateSavedViewDto {
  @ApiProperty({
    description: 'Object type this view applies to',
    enum: ['contact', 'company', 'deal'],
  })
  @IsIn(['contact', 'company', 'deal'])
  objectType: 'contact' | 'company' | 'deal';

  @ApiProperty({ description: 'View name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Filter configuration' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Columns to display',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @ApiPropertyOptional({ description: 'Sort configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortDto)
  sort?: SortDto;

  @ApiPropertyOptional({
    description: 'View type',
    enum: ['table', 'board'],
  })
  @IsOptional()
  @IsIn(['table', 'board'])
  viewType?: 'table' | 'board';

  @ApiPropertyOptional({ description: 'Set as default view' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
