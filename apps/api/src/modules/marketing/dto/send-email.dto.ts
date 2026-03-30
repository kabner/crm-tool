import {
  IsUUID,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

export class SendEmailDto {
  @IsUUID()
  emailId: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  listIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  contactIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
