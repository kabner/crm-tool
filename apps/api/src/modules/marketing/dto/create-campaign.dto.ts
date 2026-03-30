import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsIn,
  IsISO8601,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['email', 'content', 'paid', 'event', 'abm'])
  type: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
