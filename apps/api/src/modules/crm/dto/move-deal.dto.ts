import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoveDealDto {
  @ApiProperty({ description: 'Target stage ID', format: 'uuid' })
  @IsUUID()
  stageId: string;

  @ApiPropertyOptional({ description: 'Target position within the stage (0-based)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
