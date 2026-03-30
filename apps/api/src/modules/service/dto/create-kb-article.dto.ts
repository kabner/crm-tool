import {
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKBArticleDto {
  @ApiProperty({ description: 'Article title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Section ID' })
  @IsUUID()
  sectionId: string;

  @ApiProperty({ description: 'Article body HTML' })
  @IsString()
  bodyHtml: string;

  @ApiPropertyOptional({ description: 'Article body as JSON (for rich editors)' })
  @IsObject()
  @IsOptional()
  bodyJson?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Article status',
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
  })
  @IsIn(['draft', 'review', 'published', 'archived'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Visibility',
    enum: ['public', 'internal'],
    default: 'public',
  })
  @IsIn(['public', 'internal'])
  @IsOptional()
  visibility?: string;

  @ApiPropertyOptional({ description: 'SEO title' })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO description' })
  @IsString()
  @IsOptional()
  seoDescription?: string;
}
