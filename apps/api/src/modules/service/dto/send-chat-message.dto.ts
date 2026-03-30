import { IsUUID, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendChatMessageDto {
  @ApiProperty({ description: 'Chat session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Message body text' })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Sender type',
    enum: ['contact', 'agent'],
    default: 'agent',
  })
  @IsIn(['contact', 'agent'])
  @IsOptional()
  senderType?: 'contact' | 'agent';
}
