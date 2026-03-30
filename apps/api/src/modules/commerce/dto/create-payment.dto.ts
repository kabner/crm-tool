import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsUUID()
  invoiceId: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsInt()
  amount: number;

  @ApiProperty({ description: 'Payment method (card, bank_transfer, cash, check, other)' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Date payment was made (ISO)' })
  @IsDateString()
  @IsOptional()
  paidAt?: string;
}
