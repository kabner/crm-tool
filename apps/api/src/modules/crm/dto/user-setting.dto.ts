import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertUserSettingDto {
  @ApiProperty({ description: 'Settings section name' })
  @IsString()
  section: string;

  @ApiProperty({ description: 'Settings object' })
  @IsObject()
  settings: Record<string, any>;
}
