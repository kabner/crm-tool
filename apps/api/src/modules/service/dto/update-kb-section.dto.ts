import { PartialType } from '@nestjs/swagger';
import { CreateKBSectionDto } from './create-kb-section.dto';

export class UpdateKBSectionDto extends PartialType(CreateKBSectionDto) {}
