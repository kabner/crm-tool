import {
  IsString,
  IsUrl,
  IsArray,
  IsOptional,
  IsObject,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook endpoint URL' })
  @IsUrl({}, { message: 'url must be a valid URL' })
  url: string;

  @ApiProperty({
    description: 'Event types to subscribe to',
    type: [String],
    example: ['contact.created', 'deal.stage_changed'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  events: string[];

  @ApiPropertyOptional({ description: 'Optional filter configuration' })
  @IsObject()
  @IsOptional()
  filterConfig?: Record<string, any>;
}
