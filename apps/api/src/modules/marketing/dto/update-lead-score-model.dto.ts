import { PartialType } from '@nestjs/swagger';
import { CreateLeadScoreModelDto } from './create-lead-score-model.dto';

export class UpdateLeadScoreModelDto extends PartialType(CreateLeadScoreModelDto) {}
