import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

export class ContentFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Content type: page, blog_post, landing_page' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Status: draft, published, scheduled, archived' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search in title and excerpt' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Comma-separated tags' })
  @IsOptional()
  @IsString()
  tags?: string;
}
