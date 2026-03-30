import { PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsObject,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateWorkflowDto } from './create-workflow.dto';

export class WorkflowNodeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  type: string;

  @IsObject()
  config: Record<string, any>;

  @IsNumber()
  positionX: number;

  @IsNumber()
  positionY: number;
}

export class WorkflowEdgeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  fromNodeId: string;

  @IsString()
  toNodeId: string;

  @IsOptional()
  @IsString()
  conditionBranch?: string;
}

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes?: WorkflowNodeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges?: WorkflowEdgeDto[];
}
