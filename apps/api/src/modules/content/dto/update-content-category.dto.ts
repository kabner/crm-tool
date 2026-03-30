import { PartialType } from '@nestjs/swagger';
import { CreateContentCategoryDto } from './create-content-category.dto';

export class UpdateContentCategoryDto extends PartialType(CreateContentCategoryDto) {}
