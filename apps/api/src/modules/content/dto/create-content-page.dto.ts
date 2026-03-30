import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContentPageType {
  PAGE = 'page',
  BLOG_POST = 'blog_post',
  LANDING_PAGE = 'landing_page',
}

export class CreateContentPageDto {
  @ApiProperty({ description: 'Page title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: ContentPageType, description: 'Content type' })
  @IsEnum(ContentPageType)
  type: ContentPageType;

  @ApiPropertyOptional({ description: 'URL slug (auto-generated from title if not provided)' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Body content as JSON' })
  @IsObject()
  @IsNotEmpty()
  bodyJson: Record<string, any>;

  @ApiPropertyOptional({ description: 'Short excerpt' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'SEO title override' })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional({ description: 'Open Graph image URL' })
  @IsOptional()
  @IsString()
  ogImage?: string;

  @ApiPropertyOptional({ description: 'Content status', default: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;
}
