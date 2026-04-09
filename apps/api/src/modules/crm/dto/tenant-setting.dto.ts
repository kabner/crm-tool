import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertTenantSettingDto {
  @ApiProperty({ description: 'Setting value object' })
  @IsObject()
  value: Record<string, any>;
}
