import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LeadScoreRuleDto {
  @IsString()
  @IsIn(['demographic', 'behavioral'])
  type: string;

  @IsString()
  @IsNotEmpty()
  attribute: string;

  @IsObject()
  condition: Record<string, any>;

  @IsNumber()
  points: number;

  @IsOptional()
  @IsNumber()
  decayPerDay?: number;
}

export class CreateLeadScoreModelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  mqlThreshold?: number;

  @IsOptional()
  @IsInt()
  sqlThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeadScoreRuleDto)
  rules?: LeadScoreRuleDto[];
}
