import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  IsNumber,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateLineItemInput {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsInt()
  quantity: number;

  @ApiProperty({ description: 'Unit price in cents' })
  @IsInt()
  unitPrice: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Discount percentage (0-100)' })
  @IsNumber()
  @IsOptional()
  discountPct?: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  taxRateId?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Deal ID' })
  @IsUUID()
  @IsOptional()
  dealId?: string;

  @ApiProperty({ description: 'Due date in ISO format' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiProperty({ description: 'Line items', type: [CreateLineItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemInput)
  lineItems: CreateLineItemInput[];
}
