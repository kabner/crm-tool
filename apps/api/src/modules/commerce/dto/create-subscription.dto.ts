import {
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreateSubscriptionItemInput {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  priceId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @IsOptional()
  quantity?: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ description: 'Subscription items', type: [CreateSubscriptionItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionItemInput)
  items: CreateSubscriptionItemInput[];
}
