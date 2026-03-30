import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TriggerConfigDto {
  @IsIn(['form_submission', 'list_membership', 'property_change', 'manual'])
  type: 'form_submission' | 'list_membership' | 'property_change' | 'manual';

  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;
}

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => TriggerConfigDto)
  triggerConfig: TriggerConfigDto;
}
