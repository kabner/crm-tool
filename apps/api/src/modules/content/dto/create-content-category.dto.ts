import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentCategoryType {
  BLOG = 'blog',
  PAGE = 'page',
}

export class CreateContentCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL slug (auto-generated from name if not provided)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ enum: ContentCategoryType, description: 'Category type' })
  @IsEnum(ContentCategoryType)
  type: ContentCategoryType;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
