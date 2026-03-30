import { IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateListDto {
  @ApiProperty({ description: 'List name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'List type', enum: ['smart', 'static'] })
  @IsIn(['smart', 'static'])
  type: 'smart' | 'static';

  @ApiPropertyOptional({
    description: 'Smart list filter definition (required for smart lists)',
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}
