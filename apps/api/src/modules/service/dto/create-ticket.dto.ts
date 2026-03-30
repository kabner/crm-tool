import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Contact ID' })
  @IsString()
  contactId: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['urgent', 'high', 'normal', 'low'],
    default: 'normal',
  })
  @IsOptional()
  @IsIn(['urgent', 'high', 'normal', 'low'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Category ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Channel (e.g. email, web, phone)' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'Assigned user ID', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Initial message body (HTML)' })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}
