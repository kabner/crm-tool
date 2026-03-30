import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreatePriceInput {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'one_time | recurring' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsInt()
  amount: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'month | year | week | day' })
  @IsString()
  @IsOptional()
  interval?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  intervalCount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  trialDays?: number;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Stock-keeping unit' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Prices to create with the product', type: [CreatePriceInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceInput)
  @IsOptional()
  prices?: CreatePriceInput[];
}
