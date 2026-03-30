import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketMessageDto {
  @ApiProperty({ description: 'Message body (HTML)' })
  @IsString()
  bodyHtml: string;

  @ApiPropertyOptional({
    description: 'Message type',
    enum: ['reply', 'note'],
    default: 'reply',
  })
  @IsOptional()
  @IsIn(['reply', 'note'])
  type?: string;

  @ApiPropertyOptional({
    description: 'Message direction',
    enum: ['outbound', 'internal'],
    default: 'outbound',
  })
  @IsOptional()
  @IsIn(['outbound', 'internal'])
  direction?: string;
}
