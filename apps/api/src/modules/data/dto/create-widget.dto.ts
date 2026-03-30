import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsIn,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWidgetDto {
  @ApiProperty({ description: 'Widget title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Widget type',
    enum: ['kpi', 'line', 'bar', 'pie', 'funnel', 'table'],
  })
  @IsString()
  @IsIn(['kpi', 'line', 'bar', 'pie', 'funnel', 'table'])
  type: string;

  @ApiPropertyOptional({ description: 'Linked report ID' })
  @IsUUID()
  @IsOptional()
  reportId?: string;

  @ApiProperty({
    description: 'Widget configuration (metric name, color, etc.)',
    example: { metric: 'total_contacts', color: '#3b82f6' },
  })
  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @ApiProperty({
    description: 'Position and size on the grid',
    example: { x: 0, y: 0, w: 3, h: 2 },
  })
  @IsObject()
  @IsNotEmpty()
  position: { x: number; y: number; w: number; h: number };
}
