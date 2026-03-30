# 08 — Commerce Module

## Overview

The Commerce module handles the revenue operations side of the platform: product catalog, pricing, invoicing, payments, subscriptions, and revenue recognition. It bridges the gap between "deal closed" in Sales and "money collected" in accounting, replacing tools like Stripe Billing, Chargebee, FreshBooks, and HubSpot Commerce Hub.

**Key personas:** Finance/billing team, sales ops, account managers, CFO, RevOps.

**Benchmark tools:** Stripe Billing, Chargebee, Zuora, FreshBooks, HubSpot Commerce Hub, QuickBooks (invoicing), Paddle.

---

## Feature Inventory

### 8.1 Product Catalog

| Feature | Description | Priority |
|---------|-------------|----------|
| **Products** | Define products/services with name, description, SKU, category | P0 |
| **Pricing models** | One-time, recurring (monthly/annual/custom), usage-based, tiered, per-seat | P0 |
| **Price books** | Multiple price lists: standard, partner, enterprise, regional | P1 |
| **Product variants** | Variations: different tiers (Basic/Pro/Enterprise), different terms | P1 |
| **Product categories** | Hierarchical categorization | P0 |
| **Tax configuration** | Tax rates by region; tax-inclusive/exclusive pricing | P1 |
| **Currency support** | Multi-currency pricing with exchange rate management | P2 |
| **Product bundles** | Package multiple products together with bundle pricing | P2 |
| **Product images** | Product images from asset library | P1 |
| **Custom fields** | Product-level custom properties | P1 |

### 8.2 Invoicing

| Feature | Description | Priority |
|---------|-------------|----------|
| **Invoice creation** | Manual or auto-generated from deals/subscriptions | P0 |
| **Invoice builder** | Add line items, quantities, discounts, tax, notes | P0 |
| **Invoice templates** | Branded, customizable invoice templates | P0 |
| **Invoice numbering** | Auto-incrementing with configurable prefix (INV-2026-001) | P0 |
| **Invoice statuses** | Draft → Sent → Viewed → Paid → Overdue → Void | P0 |
| **Payment terms** | Net 15, Net 30, Net 60, due on receipt, custom | P0 |
| **Recurring invoices** | Auto-generate on subscription billing cycle | P0 |
| **Invoice reminders** | Auto-send payment reminders before/on/after due date | P1 |
| **Credit notes** | Issue credits against invoices | P1 |
| **Partial payments** | Accept partial payments; track balance due | P1 |
| **Invoice PDF** | Auto-generated PDF attached to emails | P0 |
| **Invoice portal** | Customer-facing page to view and pay invoices | P0 |
| **Bulk invoicing** | Generate invoices for multiple customers at once | P1 |
| **Tax calculation** | Auto-calculate tax based on customer location | P1 |
| **Invoice approval** | Approval workflow before sending to customer | P2 |

### 8.3 Payments

| Feature | Description | Priority |
|---------|-------------|----------|
| **Payment processing** | Stripe integration for credit card and ACH payments | P0 |
| **Payment links** | Shareable links for one-time or recurring payments | P0 |
| **Checkout pages** | Hosted checkout for products/subscriptions | P1 |
| **Payment methods** | Credit card, ACH/bank transfer, wire transfer (manual), PayPal (future) | P0 |
| **Saved payment methods** | Securely store customer payment methods (via Stripe) | P0 |
| **Refunds** | Full or partial refunds with reason tracking | P0 |
| **Payment receipts** | Auto-email receipts on successful payment | P0 |
| **Failed payment handling** | Retry logic, dunning emails, grace periods | P1 |
| **Payment reconciliation** | Match payments to invoices; handle over/under payments | P1 |
| **Multi-currency** | Accept payments in multiple currencies | P2 |
| **PCI compliance** | No raw card data touches our servers (Stripe Elements/tokenization) | P0 |

### 8.4 Subscriptions

| Feature | Description | Priority |
|---------|-------------|----------|
| **Subscription management** | Create, modify, cancel, pause subscriptions | P0 |
| **Billing cycles** | Monthly, quarterly, annual, custom intervals | P0 |
| **Plan changes** | Upgrade/downgrade with proration | P1 |
| **Trial periods** | Free trials with auto-conversion to paid | P1 |
| **Subscription statuses** | Active, trialing, past_due, paused, canceled, expired | P0 |
| **Cancellation flows** | Reason capture, save offers, scheduled cancellation (end of term) | P1 |
| **Renewal notifications** | Notify customer before auto-renewal | P1 |
| **Quantity changes** | Add/remove seats or units mid-cycle | P1 |
| **Add-ons** | One-time or recurring add-ons to subscriptions | P1 |
| **Usage tracking** | Meter usage for usage-based billing (API calls, storage, etc.) | P2 |
| **Dunning management** | Configurable retry schedule for failed payments; grace periods | P1 |

### 8.5 Revenue Analytics

| Feature | Description | Priority |
|---------|-------------|----------|
| **MRR/ARR tracking** | Monthly and annual recurring revenue over time | P0 |
| **MRR movements** | New, expansion, contraction, churn, reactivation breakdown | P0 |
| **Revenue recognition** | Deferred revenue tracking; recognize on schedule | P2 |
| **Customer LTV** | Lifetime value calculation by segment | P1 |
| **Churn analysis** | Customer churn rate, revenue churn rate, churn reasons | P1 |
| **Cohort revenue** | Revenue retention by signup cohort | P2 |
| **Average revenue per account** | ARPA over time | P1 |
| **Payment aging** | Outstanding receivables aging report | P1 |
| **Tax reports** | Tax collected by jurisdiction | P1 |
| **Revenue waterfall** | Visual breakdown of revenue changes period over period | P1 |

### 8.6 Quotes-to-Cash Bridge

| Feature | Description | Priority |
|---------|-------------|----------|
| **Quote → Invoice** | Accepted quote auto-generates invoice with matching line items | P1 |
| **Deal → Subscription** | Won deal with recurring products auto-creates subscription | P1 |
| **Payment → Deal close** | Payment received can auto-close associated deal | P1 |
| **Contact billing profile** | Billing address, tax ID, payment terms, default payment method per contact/company | P0 |

---

## Data Model

```
┌─────────────────┐
│    Product       │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ description      │
│ sku              │
│ category_id      │
│ status           │  (active, archived)
│ image_ids        │  (text[]) → Asset
│ custom_props     │  (JSONB)
│ created_at       │
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│     Price        │
│                  │
│ id               │
│ product_id       │
│ name             │  (e.g., "Monthly", "Annual", "Enterprise")
│ type             │  (one_time, recurring, usage)
│ amount           │  (in cents)
│ currency         │  (USD, EUR, etc.)
│ interval         │  (month, quarter, year, custom)
│ interval_count   │  (e.g., 3 for tri-annual)
│ trial_days       │
│ tier_config      │  (JSONB: for tiered/volume pricing)
│ price_book_id    │  → PriceBook (null = default)
│ stripe_price_id  │
│ status           │  (active, archived)
└─────────────────┘

┌─────────────────┐
│   PriceBook      │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ is_default       │
│ description      │
└─────────────────┘

┌─────────────────┐
│    Invoice       │
│                  │
│ id               │
│ tenant_id        │
│ number           │  (INV-2026-001)
│ contact_id       │  → Contact
│ company_id       │  → Company
│ deal_id          │  → Deal (optional)
│ subscription_id  │  → Subscription (optional)
│ status           │  (draft, sent, viewed, paid, overdue, void, refunded)
│ issue_date       │
│ due_date         │
│ payment_terms    │
│ subtotal         │
│ discount_total   │
│ tax_total        │
│ total            │
│ amount_paid      │
│ amount_due       │
│ currency         │
│ notes            │
│ footer           │
│ template_id      │
│ pdf_url          │
│ sent_at          │
│ viewed_at        │
│ paid_at          │
│ stripe_invoice_id│
│ billing_address  │  (JSONB)
│ metadata         │  (JSONB)
│ created_at       │
│ updated_at       │
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│ InvoiceLineItem  │
│                  │
│ id               │
│ invoice_id       │
│ product_id       │  → Product (optional)
│ description      │
│ quantity         │
│ unit_price       │
│ discount_pct     │
│ tax_rate_id      │  → TaxRate
│ total            │
│ period_start     │  (for subscription line items)
│ period_end       │
│ position         │
└─────────────────┘

┌─────────────────┐
│    Payment       │
│                  │
│ id               │
│ tenant_id        │
│ invoice_id       │  → Invoice
│ contact_id       │  → Contact
│ amount           │
│ currency         │
│ method           │  (credit_card, ach, wire, manual)
│ status           │  (pending, succeeded, failed, refunded, partially_refunded)
│ stripe_payment_id│
│ failure_reason   │
│ refunded_amount  │
│ metadata         │  (JSONB: card last 4, bank name, etc.)
│ paid_at          │
│ created_at       │
└─────────────────┘

┌─────────────────┐
│  Subscription    │
│                  │
│ id               │
│ tenant_id        │
│ contact_id       │  → Contact
│ company_id       │  → Company
│ deal_id          │  → Deal (originating deal)
│ status           │  (trialing, active, past_due, paused, canceled, expired)
│ current_period_start │
│ current_period_end   │
│ trial_start      │
│ trial_end        │
│ canceled_at      │
│ cancel_at_period_end │
│ pause_started_at │
│ stripe_sub_id    │
│ payment_method_id│
│ metadata         │  (JSONB)
│ created_at       │
│ updated_at       │
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────────┐
│ SubscriptionItem     │
│                      │
│ id                   │
│ subscription_id      │
│ product_id           │
│ price_id             │
│ quantity             │
│ stripe_sub_item_id   │
└──────────────────────┘

┌─────────────────┐
│    TaxRate       │
│                  │
│ id               │
│ tenant_id        │
│ name             │  (e.g., "US Sales Tax - CA")
│ percentage       │
│ jurisdiction     │
│ is_inclusive      │
│ stripe_tax_id    │
└─────────────────┘

┌─────────────────────┐
│   MRRMovement        │  (materialized for reporting)
│                      │
│ id                   │
│ tenant_id            │
│ subscription_id      │
│ type                 │  (new, expansion, contraction, churn, reactivation)
│ amount               │  (delta in MRR)
│ effective_date       │
│ created_at           │
└──────────────────────┘

┌─────────────────────┐
│  BillingProfile      │
│                      │
│ id                   │
│ tenant_id            │
│ contact_id           │
│ company_id           │
│ stripe_customer_id   │
│ billing_email        │
│ billing_address      │  (JSONB)
│ tax_id               │
│ default_payment_terms│
│ default_currency     │
│ payment_methods      │  (JSONB: from Stripe)
└──────────────────────┘
```

---

## Key Workflows

### Quote-to-Cash Flow

```
1. Sales rep creates quote from deal (Sales module)
2. Customer reviews and accepts quote (e-sign)
3. Emit: quote.accepted
4. Commerce module receives event:
   a. Create BillingProfile if not exists (or update)
   b. For one-time products:
      - Generate invoice with line items from quote
      - Set payment terms and due date
   c. For recurring products:
      - Create subscription in our DB + Stripe
      - Generate first invoice (or start trial)
5. Send invoice to customer with payment link
6. Customer pays (Stripe checkout or payment link)
7. Stripe webhook → payment.succeeded
   a. Update invoice status to "paid"
   b. Update deal stage to "Closed Won" (if not already)
   c. Record payment
   d. Send receipt
   e. Emit: payment.succeeded
8. For subscriptions: Stripe auto-charges on billing cycle
   a. Generate invoice per cycle
   b. Process payment
   c. Handle failures (dunning)
```

### Dunning (Failed Payment) Flow

```
1. Stripe webhook: invoice.payment_failed
2. Update invoice status to "overdue"
3. Update subscription status to "past_due"
4. Start dunning sequence:
   Day 0: Email customer — "Payment failed, please update payment method"
   Day 3: Reminder email + in-app notification
   Day 7: Final warning — "Service will be suspended"
   Day 14: Mark subscription as canceled (or paused, configurable)
5. Stripe automatically retries (configurable schedule: day 1, 3, 5, 7)
6. If payment succeeds at any point:
   a. Clear dunning state
   b. Update invoice and subscription to active
   c. Send confirmation email
7. Emit events at each stage for Data module tracking
```

---

## Events Emitted

| Event | Consumers |
|-------|-----------|
| `invoice.created` | Notifications, CRM (timeline) |
| `invoice.sent` | Data, CRM (timeline) |
| `invoice.paid` | Data (MRR), CRM (timeline), Sales (deal update) |
| `invoice.overdue` | Notifications, Dunning workflow |
| `payment.succeeded` | Data (revenue), CRM (timeline), Marketing (post-purchase triggers) |
| `payment.failed` | Dunning workflow, Notifications |
| `payment.refunded` | Data (revenue adjustment), CRM (timeline) |
| `subscription.created` | Data (MRR), CRM (timeline) |
| `subscription.upgraded` | Data (MRR expansion), CRM |
| `subscription.downgraded` | Data (MRR contraction), CRM |
| `subscription.canceled` | Data (MRR churn), CRM, Marketing (winback triggers) |
| `subscription.renewed` | Data, CRM |

---

## Cross-Module Dependencies

| Module | Commerce Provides | Commerce Consumes |
|--------|------------------|-------------------|
| **CRM** | Purchase history, subscription status, LTV on contact | Contact/company data for billing |
| **Sales** | Invoice generation from quotes, payment status | Quote data, deal products |
| **Marketing** | Purchase triggers for automation, customer segments by revenue | Campaign attribution for revenue |
| **Service** | Billing context for support agents, subscription tier | Ticket data (billing issues → priority) |
| **Data** | Revenue events, MRR data, payment analytics | Report/dashboard data |

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| High invoice volume | Batch generation via job queue; PDF generation parallelized |
| Stripe webhook processing | Idempotent handlers; webhook signature verification; dead-letter queue for failures |
| MRR calculation accuracy | Event-sourced MRR movements; reconcile with Stripe periodically |
| Multi-currency reporting | Normalize to base currency at event time; store both original and normalized |
| Tax calculation complexity | Integration with tax API (TaxJar/Avalara) for edge cases |
| PCI compliance | Zero card data on our servers; Stripe Elements handles all sensitive data |
