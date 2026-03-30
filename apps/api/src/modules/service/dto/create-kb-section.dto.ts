import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKBSectionDto {
  @ApiProperty({ description: 'Section name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Parent category ID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'URL slug (auto-generated from name if omitted)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Section description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Display position', default: 0 })
  @IsInt()
  @IsOptional()
  position?: number;
}
