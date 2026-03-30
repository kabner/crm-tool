import {
  IsString,
  IsUrl,
  IsArray,
  IsOptional,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: 'Webhook endpoint URL' })
  @IsUrl({}, { message: 'url must be a valid URL' })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({
    description: 'Event types to subscribe to',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  events?: string[];

  @ApiPropertyOptional({
    description: 'Endpoint status',
    enum: ['active', 'paused'],
  })
  @IsString()
  @IsIn(['active', 'paused'])
  @IsOptional()
  status?: string;
}
