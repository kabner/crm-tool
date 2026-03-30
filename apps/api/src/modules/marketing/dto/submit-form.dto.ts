import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class SubmitFormDto {
  @IsUUID()
  @IsNotEmpty()
  formId: string;

  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @IsOptional()
  @IsString()
  pageUrl?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsObject()
  utmParams?: Record<string, any>;
}
