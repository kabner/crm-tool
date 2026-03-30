import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../shared/common/dto/pagination.dto';

export class ListFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by list type',
    enum: ['smart', 'static'],
  })
  @IsOptional()
  @IsIn(['smart', 'static'])
  type?: 'smart' | 'static';

  @ApiPropertyOptional({ description: 'Search by list name' })
  @IsOptional()
  @IsString()
  search?: string;
}
