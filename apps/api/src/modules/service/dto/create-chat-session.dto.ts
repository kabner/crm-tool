import { IsOptional, IsUUID, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiPropertyOptional({ description: 'Contact ID for known visitors' })
  @IsUUID()
  @IsOptional()
  contactId?: string;

  @ApiPropertyOptional({
    description: 'Session metadata (page URL, device info, etc.)',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
