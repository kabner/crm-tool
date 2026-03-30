import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommerceSchema1711900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ══════════════════════════════════════════════════════════════════
    // COMMERCE MODULE
    // ══════════════════════════════════════════════════════════════════

    // ── Products ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "description"  TEXT,
        "sku"          VARCHAR,
        "category_id"  VARCHAR,
        "status"       VARCHAR NOT NULL DEFAULT 'active',
        "image_ids"    TEXT[] NOT NULL DEFAULT '{}',
        "custom_props" JSONB NOT NULL DEFAULT '{}',
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_tenant" ON "products"("tenant_id")
    `);

    // ── Price Books ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "price_books" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "is_default"  BOOLEAN NOT NULL DEFAULT false,
        "description" VARCHAR
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_price_books_tenant" ON "price_books"("tenant_id")
    `);

    // ── Prices ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "prices" (
        "id"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "product_id"     UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "name"           VARCHAR NOT NULL,
        "type"           VARCHAR NOT NULL,
        "amount"         INTEGER NOT NULL,
        "currency"       VARCHAR NOT NULL DEFAULT 'USD',
        "interval"       VARCHAR,
        "interval_count" INTEGER NOT NULL DEFAULT 1,
        "trial_days"     INTEGER NOT NULL DEFAULT 0,
        "tier_config"    JSONB,
        "price_book_id"  UUID REFERENCES "price_books"("id") ON DELETE SET NULL,
        "status"         VARCHAR NOT NULL DEFAULT 'active',
        "created_at"     TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_prices_product" ON "prices"("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_prices_price_book" ON "prices"("price_book_id")
    `);

    // ── Tax Rates ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tax_rates" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "percentage"   DECIMAL(5,2) NOT NULL,
        "jurisdiction" VARCHAR,
        "is_inclusive"  BOOLEAN NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tax_rates_tenant" ON "tax_rates"("tenant_id")
    `);

    // ── Subscriptions ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id"                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"            UUID NOT NULL,
        "contact_id"           UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "company_id"           UUID,
        "deal_id"              UUID,
        "status"               VARCHAR NOT NULL DEFAULT 'active',
        "current_period_start" TIMESTAMP NOT NULL,
        "current_period_end"   TIMESTAMP NOT NULL,
        "trial_start"          TIMESTAMP,
        "trial_end"            TIMESTAMP,
        "canceled_at"          TIMESTAMP,
        "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
        "pause_started_at"     TIMESTAMP,
        "metadata"             JSONB NOT NULL DEFAULT '{}',
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_tenant_status" ON "subscriptions"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_tenant_contact" ON "subscriptions"("tenant_id", "contact_id")
    `);

    // ── Subscription Items ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "subscription_items" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "subscription_id" UUID NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        "product_id"      UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "price_id"        UUID NOT NULL REFERENCES "prices"("id") ON DELETE CASCADE,
        "quantity"         INTEGER NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_subscription_items_subscription" ON "subscription_items"("subscription_id")
    `);

    // ── Invoices ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"       UUID NOT NULL,
        "number"          VARCHAR NOT NULL,
        "contact_id"      UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "company_id"      UUID,
        "deal_id"         UUID,
        "subscription_id" UUID REFERENCES "subscriptions"("id") ON DELETE SET NULL,
        "status"          VARCHAR NOT NULL DEFAULT 'draft',
        "issue_date"      TIMESTAMP NOT NULL,
        "due_date"        TIMESTAMP NOT NULL,
        "payment_terms"   VARCHAR,
        "subtotal"        INTEGER NOT NULL DEFAULT 0,
        "discount_total"  INTEGER NOT NULL DEFAULT 0,
        "tax_total"       INTEGER NOT NULL DEFAULT 0,
        "total"           INTEGER NOT NULL DEFAULT 0,
        "amount_paid"     INTEGER NOT NULL DEFAULT 0,
        "amount_due"      INTEGER NOT NULL DEFAULT 0,
        "currency"        VARCHAR NOT NULL DEFAULT 'USD',
        "notes"           TEXT,
        "footer"          TEXT,
        "pdf_url"         VARCHAR,
        "sent_at"         TIMESTAMP,
        "viewed_at"       TIMESTAMP,
        "paid_at"         TIMESTAMP,
        "billing_address" JSONB,
        "metadata"        JSONB NOT NULL DEFAULT '{}',
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_tenant_status" ON "invoices"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoices_tenant_contact" ON "invoices"("tenant_id", "contact_id")
    `);

    // ── Invoice Line Items ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "invoice_line_items" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoice_id"   UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
        "product_id"   UUID REFERENCES "products"("id") ON DELETE SET NULL,
        "description"  VARCHAR NOT NULL,
        "quantity"     INTEGER NOT NULL DEFAULT 1,
        "unit_price"   INTEGER NOT NULL,
        "discount_pct" DECIMAL(12,2),
        "tax_rate_id"  UUID REFERENCES "tax_rates"("id") ON DELETE SET NULL,
        "total"        INTEGER NOT NULL,
        "period_start" TIMESTAMP,
        "period_end"   TIMESTAMP,
        "position"     INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_invoice_line_items_invoice" ON "invoice_line_items"("invoice_id")
    `);

    // ── Payments ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"       UUID NOT NULL,
        "invoice_id"      UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
        "contact_id"      UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "amount"          INTEGER NOT NULL,
        "currency"        VARCHAR NOT NULL DEFAULT 'USD',
        "method"          VARCHAR NOT NULL,
        "status"          VARCHAR NOT NULL,
        "failure_reason"  VARCHAR,
        "refunded_amount" INTEGER NOT NULL DEFAULT 0,
        "metadata"        JSONB NOT NULL DEFAULT '{}',
        "paid_at"         TIMESTAMP,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payments_tenant" ON "payments"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payments_invoice" ON "payments"("invoice_id")
    `);

    // ── MRR Movements ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "mrr_movements" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"       UUID NOT NULL,
        "subscription_id" UUID NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        "type"            VARCHAR NOT NULL,
        "amount"          INTEGER NOT NULL,
        "effective_date"  TIMESTAMP NOT NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_mrr_movements_tenant" ON "mrr_movements"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_mrr_movements_subscription" ON "mrr_movements"("subscription_id")
    `);

    // ── Billing Profiles ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "billing_profiles" (
        "id"                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"             UUID NOT NULL,
        "contact_id"            UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "company_id"            UUID,
        "billing_email"         VARCHAR,
        "billing_address"       JSONB,
        "tax_id"                VARCHAR,
        "default_payment_terms" VARCHAR,
        "default_currency"      VARCHAR NOT NULL DEFAULT 'USD',
        "payment_methods"       JSONB NOT NULL DEFAULT '[]'
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_billing_profiles_tenant" ON "billing_profiles"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_billing_profiles_tenant_contact" ON "billing_profiles"("tenant_id", "contact_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "billing_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mrr_movements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoice_line_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tax_rates" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prices" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "price_books" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
  }
}
