import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsObject,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ description: 'Contact first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Contact last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Contact email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact job title' })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ description: 'Primary company ID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({ description: 'Lead status' })
  @IsString()
  @IsOptional()
  leadStatus?: string;

  @ApiPropertyOptional({ description: 'Owner user ID' })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Custom properties' })
  @IsObject()
  @IsOptional()
  customProps?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Lead source' })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ description: 'Contact type' })
  @IsString()
  @IsOptional()
  contactType?: string;

  @ApiPropertyOptional({
    description: 'Company IDs to associate',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  companyIds?: string[];

  @ApiPropertyOptional({ description: 'Record visibility', enum: ['everyone', 'owner', 'private'] })
  @IsOptional()
  @IsString()
  @IsIn(['everyone', 'owner', 'private'])
  visibility?: string;
}
