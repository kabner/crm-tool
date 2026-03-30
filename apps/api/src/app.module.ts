import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { databaseConfig } from './config/database.config';
import { SharedModule } from './shared/shared.module';
import { CrmModule } from './modules/crm/crm.module';
import { SalesModule } from './modules/sales/sales.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ServiceModule } from './modules/service/service.module';
import { ContentModule } from './modules/content/content.module';
import { DataModule } from './modules/data/data.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),
    SharedModule,
    CrmModule,
    SalesModule,
    MarketingModule,
    ServiceModule,
    ContentModule,
    DataModule,
    CommerceModule,
    IntegrationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
