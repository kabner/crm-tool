import { IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'Entity type', enum: ['contact', 'company'] })
  @IsIn(['contact', 'company'])
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  @IsUUID()
  entityId: string;
}
