import { PartialType } from '@nestjs/swagger';
import { CreateKBCategoryDto } from './create-kb-category.dto';

export class UpdateKBCategoryDto extends PartialType(CreateKBCategoryDto) {}
