import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDashboardDto } from './create-dashboard.dto';

export class UpdateDashboardDto extends PartialType(CreateDashboardDto) {
  @ApiPropertyOptional({ description: 'Widget layout configuration' })
  @IsArray()
  @IsOptional()
  layout?: object[];

  @ApiPropertyOptional({ description: 'User IDs to share dashboard with' })
  @IsArray()
  @IsOptional()
  sharedWith?: string[];
}
