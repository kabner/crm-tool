import { MigrationInterface, QueryRunner } from 'typeorm';

export class DataIntegrationsSchema1711910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ══════════════════════════════════════════════════════════════════
    // DATA MODULE
    // ══════════════════════════════════════════════════════════════════

    // ── Dashboards ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "dashboards" (
        "id"                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"          UUID NOT NULL,
        "name"               VARCHAR NOT NULL,
        "description"        VARCHAR,
        "created_by"         UUID NOT NULL,
        "layout"             JSONB NOT NULL DEFAULT '[]',
        "default_date_range" VARCHAR,
        "is_system"          BOOLEAN NOT NULL DEFAULT false,
        "shared_with"        JSONB NOT NULL DEFAULT '[]',
        "created_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_dashboards_tenant" ON "dashboards"("tenant_id")
    `);

    // ── Reports ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"         UUID NOT NULL,
        "name"              VARCHAR NOT NULL,
        "description"       VARCHAR,
        "data_source"       VARCHAR NOT NULL,
        "joins"             JSONB,
        "fields"            JSONB NOT NULL DEFAULT '[]',
        "filters"           JSONB NOT NULL DEFAULT '[]',
        "group_by"          JSONB,
        "sort"              JSONB,
        "visualization"     JSONB NOT NULL DEFAULT '{}',
        "calculated_fields" JSONB,
        "created_by"        UUID NOT NULL,
        "is_system"         BOOLEAN NOT NULL DEFAULT false,
        "cache_key"         VARCHAR,
        "cache_ttl"         INTEGER,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_reports_tenant" ON "reports"("tenant_id")
    `);

    // ── Dashboard Widgets ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "dashboard_widgets" (
        "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "dashboard_id"     UUID NOT NULL REFERENCES "dashboards"("id") ON DELETE CASCADE,
        "title"            VARCHAR NOT NULL,
        "type"             VARCHAR NOT NULL,
        "report_id"        UUID REFERENCES "reports"("id") ON DELETE SET NULL,
        "config"           JSONB NOT NULL DEFAULT '{}',
        "position"         JSONB NOT NULL,
        "refresh_interval" INTEGER
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_dashboard_widgets_dashboard" ON "dashboard_widgets"("dashboard_id")
    `);

    // ══════════════════════════════════════════════════════════════════
    // INTEGRATIONS MODULE
    // ══════════════════════════════════════════════════════════════════

    // ── Webhook Endpoints ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "webhook_endpoints" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "url"           VARCHAR NOT NULL,
        "secret"        VARCHAR NOT NULL,
        "events"        TEXT[] NOT NULL,
        "filter_config" JSONB,
        "status"        VARCHAR NOT NULL DEFAULT 'active',
        "created_by"    UUID NOT NULL,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_webhook_endpoints_tenant" ON "webhook_endpoints"("tenant_id")
    `);

    // ── Webhook Deliveries ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "webhook_deliveries" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "endpoint_id"     UUID NOT NULL REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE,
        "event_type"      VARCHAR NOT NULL,
        "payload"         JSONB NOT NULL,
        "status"          VARCHAR NOT NULL DEFAULT 'pending',
        "attempts"        INTEGER NOT NULL DEFAULT 0,
        "last_attempt_at" TIMESTAMP,
        "response_status" INTEGER,
        "response_body"   TEXT,
        "duration_ms"     INTEGER,
        "next_retry_at"   TIMESTAMP,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_webhook_deliveries_endpoint" ON "webhook_deliveries"("endpoint_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_webhook_deliveries_status" ON "webhook_deliveries"("status")
        WHERE "status" IN ('pending', 'retrying')
    `);

    // ── API Keys ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "key_hash"     VARCHAR NOT NULL,
        "key_prefix"   VARCHAR NOT NULL,
        "scopes"       JSONB NOT NULL DEFAULT '{}',
        "rate_limit"   INTEGER NOT NULL DEFAULT 100,
        "expires_at"   TIMESTAMP,
        "last_used_at" TIMESTAMP,
        "created_by"   UUID NOT NULL,
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "revoked_at"   TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_tenant" ON "api_keys"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_key_prefix" ON "api_keys"("key_prefix")
    `);

    // ── Integrations ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "integrations" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "type"          VARCHAR NOT NULL,
        "provider"      VARCHAR NOT NULL,
        "name"          VARCHAR NOT NULL,
        "status"        VARCHAR NOT NULL DEFAULT 'disconnected',
        "config"        JSONB NOT NULL DEFAULT '{}',
        "connected_by"  UUID,
        "connected_at"  TIMESTAMP,
        "last_sync_at"  TIMESTAMP,
        "error_message" VARCHAR,
        "metadata"      JSONB NOT NULL DEFAULT '{}'
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_integrations_tenant" ON "integrations"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_integrations_tenant_provider" ON "integrations"("tenant_id", "provider")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "integrations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook_deliveries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "webhook_endpoints" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_widgets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboards" CASCADE`);
  }
}
