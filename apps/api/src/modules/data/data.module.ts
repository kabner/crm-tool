import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Data entities
import { Dashboard } from './entities/dashboard.entity';
import { DashboardWidget } from './entities/dashboard-widget.entity';
import { Report } from './entities/report.entity';

// CRM entities used for cross-object reporting and analytics
import { Contact } from '../crm/entities/contact.entity';
import { Company } from '../crm/entities/company.entity';
import { Deal } from '../crm/entities/deal.entity';
import { Activity } from '../crm/entities/activity.entity';
import { Ticket } from '../service/entities/ticket.entity';

// Services
import { DashboardsService } from './services/dashboards.service';
import { ReportsService } from './services/reports.service';
import { AnalyticsService } from './services/analytics.service';

// Controllers
import { DashboardsController } from './controllers/dashboards.controller';
import { ReportsController } from './controllers/reports.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Data entities
      Dashboard,
      DashboardWidget,
      Report,
      // CRM entities for analytics queries
      Contact,
      Company,
      Deal,
      Activity,
      Ticket,
    ]),
  ],
  controllers: [DashboardsController, ReportsController, AnalyticsController],
  providers: [DashboardsService, ReportsService, AnalyticsService],
  exports: [DashboardsService, ReportsService, AnalyticsService],
})
export class DataModule {}
