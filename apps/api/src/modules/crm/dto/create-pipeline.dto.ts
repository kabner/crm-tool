import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PipelineStageDto {
  @ApiProperty({ description: 'Stage name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Stage position/order' })
  @IsNumber()
  position: number;

  @ApiProperty({ description: 'Win probability (0-100)' })
  @IsNumber()
  probability: number;

  @ApiProperty({
    description: 'Stage type: open, won, or lost',
    default: 'open',
  })
  @IsString()
  stageType: string;
}

export class CreatePipelineDto {
  @ApiProperty({ description: 'Pipeline name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Pipeline type: sales or project',
    default: 'sales',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default pipeline',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Pipeline stages to create',
    type: [PipelineStageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PipelineStageDto)
  stages?: PipelineStageDto[];
}
