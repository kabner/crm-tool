import {
  IsString,
  IsObject,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Scopes for the API key',
    example: { contacts: 'read', deals: 'read_write' },
  })
  @IsObject()
  scopes: Record<string, 'read' | 'read_write'>;

  @ApiPropertyOptional({ description: 'Rate limit per minute', default: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Expiration date in ISO format' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
