import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKBCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'URL slug (auto-generated from name if omitted)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon identifier' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Display position', default: 0 })
  @IsInt()
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({
    description: 'Visibility',
    enum: ['public', 'internal'],
    default: 'public',
  })
  @IsIn(['public', 'internal'])
  @IsOptional()
  visibility?: string;
}
