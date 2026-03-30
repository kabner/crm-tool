import { PartialType } from '@nestjs/swagger';
import { CreateKBArticleDto } from './create-kb-article.dto';

export class UpdateKBArticleDto extends PartialType(CreateKBArticleDto) {}
