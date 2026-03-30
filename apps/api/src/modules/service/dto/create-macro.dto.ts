import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MacroActionDto {
  @ApiProperty({ description: 'Action type (e.g. set_status, set_priority, add_tag, assign)' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Action value' })
  value: any;
}

export class CreateMacroDto {
  @ApiProperty({ description: 'Macro name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'List of actions to execute', type: [MacroActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MacroActionDto)
  actions: MacroActionDto[];

  @ApiPropertyOptional({ description: 'Visibility: personal or shared', default: 'personal' })
  @IsOptional()
  @IsString()
  visibility?: string;
}
