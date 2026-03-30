import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class TrackPageViewDto {
  @IsString()
  @IsNotEmpty()
  pageUrl: string;

  @IsOptional()
  @IsString()
  pageTitle?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  utmContent?: string;

  @IsOptional()
  @IsString()
  utmTerm?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsNumber()
  durationMs?: number;
}
