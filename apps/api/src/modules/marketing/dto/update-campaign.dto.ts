import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateCampaignDto } from './create-campaign.dto';

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @IsOptional()
  @IsString()
  @IsIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
  status?: string;
}
