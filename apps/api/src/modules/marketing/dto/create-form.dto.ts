import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsObject,
  IsBoolean,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FormFieldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsIn([
    'text',
    'email',
    'phone',
    'textarea',
    'dropdown',
    'checkbox',
    'radio',
    'date',
    'hidden',
  ])
  type: string;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  defaultValue?: string;
}

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  fields: FormFieldDto[];

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
