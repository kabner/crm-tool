import {
  IsString,
  IsOptional,
  IsEmail,
  IsObject,
  IsUUID,
  IsIn,
  IsNotEmpty,
} from 'class-validator';

export class CreateEmailDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  previewText?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsOptional()
  @IsObject()
  contentJson?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsIn(['broadcast', 'automated'])
  sendType?: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
