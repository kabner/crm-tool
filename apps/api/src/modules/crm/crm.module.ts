import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contact,
  Company,
  ContactCompany,
  Deal,
  DealStage,
  Pipeline,
  Activity,
  CustomProperty,
  List,
  ListMembership,
  SavedView,
} from './entities';
import { ContactsController } from './controllers/contacts.controller';
import { ContactsService } from './services/contacts.service';
import { CompaniesController } from './controllers/companies.controller';
import { CompaniesService } from './services/companies.service';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { DealsController } from './controllers/deals.controller';
import { DealsService } from './services/deals.service';
import { PipelinesController } from './controllers/pipelines.controller';
import { PipelinesService } from './services/pipelines.service';
import { ListsController } from './controllers/lists.controller';
import { ListsService } from './services/lists.service';
import { ImportExportController } from './controllers/import-export.controller';
import { ImportExportService } from './services/import-export.service';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { SavedViewsController } from './controllers/saved-views.controller';
import { SavedViewsService } from './services/saved-views.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contact,
      Company,
      ContactCompany,
      Deal,
      DealStage,
      Pipeline,
      Activity,
      CustomProperty,
      List,
      ListMembership,
      SavedView,
    ]),
  ],
  controllers: [ContactsController, CompaniesController, ActivitiesController, DealsController, PipelinesController, ListsController, ImportExportController, SearchController, SavedViewsController],
  providers: [ContactsService, CompaniesService, ActivitiesService, DealsService, PipelinesService, ListsService, ImportExportService, SearchService, SavedViewsService],
  exports: [ContactsService, CompaniesService, ActivitiesService, DealsService, PipelinesService, ListsService, ImportExportService, SearchService, SavedViewsService],
})
export class CrmModule {}
