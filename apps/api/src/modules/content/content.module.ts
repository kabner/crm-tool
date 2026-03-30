import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ContentPage,
  ContentVersion,
  ContentCategory,
  Asset,
  AssetFolder,
  SiteTheme,
  Redirect,
} from './entities';
import { ContentService } from './services/content.service';
import { CategoriesService } from './services/categories.service';
import { AssetsService } from './services/assets.service';
import { ContentController } from './controllers/content.controller';
import { ContentCategoriesController } from './controllers/content-categories.controller';
import { AssetsController } from './controllers/assets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentPage,
      ContentVersion,
      ContentCategory,
      Asset,
      AssetFolder,
      SiteTheme,
      Redirect,
    ]),
  ],
  controllers: [
    ContentController,
    ContentCategoriesController,
    AssetsController,
  ],
  providers: [ContentService, CategoriesService, AssetsService],
  exports: [ContentService, CategoriesService, AssetsService],
})
export class ContentModule {}
