import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Product,
  Price,
  PriceBook,
  Invoice,
  InvoiceLineItem,
  Payment,
  Subscription,
  SubscriptionItem,
  TaxRate,
  MRRMovement,
  BillingProfile,
} from './entities';
import { Contact } from '../crm/entities/contact.entity';
import { Company } from '../crm/entities/company.entity';
import { ProductsController } from './controllers/products.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { PaymentsController } from './controllers/payments.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { RevenueController } from './controllers/revenue.controller';
import { ProductsService } from './services/products.service';
import { InvoicesService } from './services/invoices.service';
import { PaymentsService } from './services/payments.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { RevenueService } from './services/revenue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Price,
      PriceBook,
      Invoice,
      InvoiceLineItem,
      Payment,
      Subscription,
      SubscriptionItem,
      TaxRate,
      MRRMovement,
      BillingProfile,
      Contact,
      Company,
    ]),
  ],
  controllers: [
    ProductsController,
    InvoicesController,
    PaymentsController,
    SubscriptionsController,
    RevenueController,
  ],
  providers: [
    ProductsService,
    InvoicesService,
    PaymentsService,
    SubscriptionsService,
    RevenueService,
  ],
  exports: [
    ProductsService,
    InvoicesService,
    PaymentsService,
    SubscriptionsService,
    RevenueService,
  ],
})
export class CommerceModule {}
