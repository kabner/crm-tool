import { IsString, IsOptional, IsObject, IsNotEmpty } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsObject()
  contentJson: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  contentHtml: string;
}
