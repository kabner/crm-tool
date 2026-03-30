import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSequenceDto } from './create-sequence.dto';

export class SequenceStepDto {
  @IsNumber()
  position: number;

  @IsIn(['email', 'manual_email', 'task', 'delay'])
  type: 'email' | 'manual_email' | 'task' | 'delay';

  @IsNumber()
  @IsOptional()
  delayDays?: number;

  @IsNumber()
  @IsOptional()
  delayHours?: number;

  @IsObject()
  config: Record<string, any>;
}

export class UpdateSequenceDto extends PartialType(CreateSequenceDto) {
  @ApiPropertyOptional({
    description: 'Sequence steps (replaces all existing steps)',
    type: [SequenceStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SequenceStepDto)
  @IsOptional()
  steps?: SequenceStepDto[];
}
