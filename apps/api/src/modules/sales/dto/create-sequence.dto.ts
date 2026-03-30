import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSequenceDto {
  @ApiProperty({ description: 'Sequence name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Sequence settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
