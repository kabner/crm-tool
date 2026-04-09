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
  UserFavorite,
  UserSetting,
  User,
  FeedReaction,
  ContactTypeOption,
  ActivityTypeOption,
  RecordAttachment,
  Lead,
  TenantSetting,
  ExchangeRate,
  PipelineField,
  GoogleConnection,
  EmailSyncLog,
} from './entities';
import { Notification } from '../../shared/notifications/entities/notification.entity';
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
import { FavoritesController } from './controllers/favorites.controller';
import { FavoritesService } from './services/favorites.service';
import { UserSettingsController } from './controllers/user-settings.controller';
import { UserSettingsService } from './services/user-settings.service';
import { FeedController } from './controllers/feed.controller';
import { FeedService } from './services/feed.service';
import { ContactTypesController } from './controllers/contact-types.controller';
import { ContactTypesService } from './services/contact-types.service';
import { ActivityTypesController } from './controllers/activity-types.controller';
import { ActivityTypesService } from './services/activity-types.service';
import { AttachmentsController } from './controllers/attachments.controller';
import { AttachmentsService } from './services/attachments.service';
import { LeadsController } from './controllers/leads.controller';
import { LeadsService } from './services/leads.service';
import { CardScannerController } from './controllers/card-scanner.controller';
import { CardScannerService } from './services/card-scanner.service';
import { TenantSettingsController } from './controllers/tenant-settings.controller';
import { TenantSettingsService } from './services/tenant-settings.service';
import { CurrencyController } from './controllers/currency.controller';
import { CurrencyService } from './services/currency.service';
import { PipelineFieldsController } from './controllers/pipeline-fields.controller';
import { PipelineFieldsService } from './services/pipeline-fields.service';
import { GoogleIntegrationController } from './controllers/google-integration.controller';
import { GoogleAuthService } from './services/google-auth.service';
import { GmailSyncService } from './services/gmail-sync.service';
import { CalendarSyncService } from './services/calendar-sync.service';

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
      UserFavorite,
      UserSetting,
      User,
      FeedReaction,
      Notification,
      ContactTypeOption,
      ActivityTypeOption,
      RecordAttachment,
      Lead,
      TenantSetting,
      ExchangeRate,
      PipelineField,
      GoogleConnection,
      EmailSyncLog,
    ]),
  ],
  controllers: [ContactsController, CompaniesController, ActivitiesController, DealsController, PipelinesController, ListsController, ImportExportController, SearchController, SavedViewsController, FavoritesController, UserSettingsController, FeedController, ContactTypesController, ActivityTypesController, AttachmentsController, LeadsController, CardScannerController, TenantSettingsController, CurrencyController, PipelineFieldsController, GoogleIntegrationController],
  providers: [ContactsService, CompaniesService, ActivitiesService, DealsService, PipelinesService, ListsService, ImportExportService, SearchService, SavedViewsService, FavoritesService, UserSettingsService, FeedService, ContactTypesService, ActivityTypesService, AttachmentsService, LeadsService, CardScannerService, TenantSettingsService, CurrencyService, PipelineFieldsService, GoogleAuthService, GmailSyncService, CalendarSyncService],
  exports: [ContactsService, CompaniesService, ActivitiesService, DealsService, PipelinesService, ListsService, ImportExportService, SearchService, SavedViewsService, FavoritesService, UserSettingsService, FeedService, ContactTypesService, ActivityTypesService, AttachmentsService, LeadsService, CardScannerService, TenantSettingsService, CurrencyService, PipelineFieldsService, GoogleAuthService, GmailSyncService, CalendarSyncService],
})
export class CrmModule {}
