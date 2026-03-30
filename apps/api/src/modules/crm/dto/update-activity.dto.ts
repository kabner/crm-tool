import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';

export class UpdateActivityDto extends PartialType(CreateActivityDto) {
  @ApiPropertyOptional({ description: 'Completion timestamp (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
