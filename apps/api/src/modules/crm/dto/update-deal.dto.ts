import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDealDto } from './create-deal.dto';

export class UpdateDealDto extends PartialType(CreateDealDto) {
  @ApiPropertyOptional({ description: 'Whether the deal was won' })
  @IsOptional()
  @IsBoolean()
  won?: boolean;
}
