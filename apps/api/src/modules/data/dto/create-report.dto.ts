import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsIn,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Report description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data source table',
    enum: [
      'contacts',
      'companies',
      'deals',
      'tickets',
      'activities',
      'invoices',
      'subscriptions',
    ],
  })
  @IsString()
  @IsIn([
    'contacts',
    'companies',
    'deals',
    'tickets',
    'activities',
    'invoices',
    'subscriptions',
  ])
  dataSource: string;

  @ApiProperty({
    description: 'Fields to include in the report',
    example: ['firstName', 'lastName', 'email'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fields: string[];

  @ApiPropertyOptional({
    description: 'Filter conditions',
    example: [{ field: 'lifecycleStage', operator: 'eq', value: 'lead' }],
  })
  @IsArray()
  @IsOptional()
  filters?: any[];

  @ApiPropertyOptional({
    description: 'Group by configuration',
    example: { field: 'lifecycleStage' },
  })
  @IsObject()
  @IsOptional()
  groupBy?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sort configuration',
    example: { field: 'createdAt', order: 'DESC' },
  })
  @IsObject()
  @IsOptional()
  sort?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Visualization type and config',
    example: { type: 'table' },
  })
  @IsObject()
  @IsOptional()
  visualization?: Record<string, any>;
}
