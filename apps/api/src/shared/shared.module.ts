import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { EventsModule } from './events/events.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    AuthModule,
    TenancyModule,
    EventsModule,
    AuditModule,
    NotificationsModule,
    SearchModule,
    StorageModule,
  ],
  exports: [
    AuthModule,
    TenancyModule,
    EventsModule,
    AuditModule,
    NotificationsModule,
    SearchModule,
    StorageModule,
  ],
})
export class SharedModule {}
