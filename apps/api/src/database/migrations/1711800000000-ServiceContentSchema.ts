import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceContentSchema1711800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ══════════════════════════════════════════════════════════════════
    // SERVICE MODULE
    // ══════════════════════════════════════════════════════════════════

    // ── Ticket Categories ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ticket_categories" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "parent_id"   UUID REFERENCES "ticket_categories"("id") ON DELETE SET NULL,
        "description" VARCHAR,
        "position"    INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_categories_tenant" ON "ticket_categories"("tenant_id")
    `);

    // ── Business Hours ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "business_hours" (
        "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "name"      VARCHAR NOT NULL,
        "timezone"  VARCHAR NOT NULL DEFAULT 'UTC',
        "schedule"  JSONB NOT NULL,
        "holidays"  JSONB NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_business_hours_tenant" ON "business_hours"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_business_hours_schedule" ON "business_hours" USING GIN ("schedule")
    `);

    // ── SLA Policies ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sla_policies" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"         UUID NOT NULL,
        "name"              VARCHAR NOT NULL,
        "is_default"        BOOLEAN NOT NULL DEFAULT false,
        "conditions"        JSONB NOT NULL,
        "targets"           JSONB NOT NULL,
        "business_hours_id" UUID REFERENCES "business_hours"("id") ON DELETE SET NULL,
        "priority"          INTEGER NOT NULL DEFAULT 0,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sla_policies_tenant" ON "sla_policies"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sla_policies_conditions" ON "sla_policies" USING GIN ("conditions")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sla_policies_targets" ON "sla_policies" USING GIN ("targets")
    `);

    // ── Tickets ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id"                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"              UUID NOT NULL,
        "number"                 VARCHAR NOT NULL,
        "subject"                VARCHAR NOT NULL,
        "status"                 VARCHAR NOT NULL DEFAULT 'new',
        "priority"               VARCHAR NOT NULL DEFAULT 'normal',
        "category_id"            UUID REFERENCES "ticket_categories"("id") ON DELETE SET NULL,
        "contact_id"             UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "company_id"             UUID,
        "assigned_to"            UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "assigned_team"          VARCHAR,
        "channel"                VARCHAR NOT NULL DEFAULT 'email',
        "sla_policy_id"          UUID REFERENCES "sla_policies"("id") ON DELETE SET NULL,
        "first_response_at"      TIMESTAMP,
        "resolved_at"            TIMESTAMP,
        "closed_at"              TIMESTAMP,
        "sla_first_response_due" TIMESTAMP,
        "sla_resolution_due"     TIMESTAMP,
        "sla_breached"           BOOLEAN NOT NULL DEFAULT false,
        "sla_paused_at"          TIMESTAMP,
        "satisfaction"           VARCHAR,
        "satisfaction_comment"   TEXT,
        "tags"                   TEXT[] NOT NULL DEFAULT '{}',
        "custom_props"           JSONB NOT NULL DEFAULT '{}',
        "source_data"            JSONB,
        "parent_ticket_id"       UUID REFERENCES "tickets"("id") ON DELETE SET NULL,
        "merged_into_id"         UUID REFERENCES "tickets"("id") ON DELETE SET NULL,
        "created_at"             TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"             TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_status" ON "tickets"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_assigned_to" ON "tickets"("tenant_id", "assigned_to")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_tenant_contact" ON "tickets"("tenant_id", "contact_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tickets_tenant_number" ON "tickets"("tenant_id", "number")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_custom_props" ON "tickets" USING GIN ("custom_props")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_source_data" ON "tickets" USING GIN ("source_data")
    `);

    // ── Ticket Messages ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ticket_messages" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "ticket_id"    UUID NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
        "type"         VARCHAR NOT NULL DEFAULT 'reply',
        "direction"    VARCHAR NOT NULL,
        "from_contact" BOOLEAN NOT NULL DEFAULT false,
        "user_id"      UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "body_html"    TEXT NOT NULL,
        "body_text"    TEXT,
        "attachments"  JSONB NOT NULL DEFAULT '[]',
        "created_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_messages_ticket" ON "ticket_messages"("ticket_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_messages_attachments" ON "ticket_messages" USING GIN ("attachments")
    `);

    // ── Ticket Macros ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ticket_macros" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "actions"     JSONB NOT NULL,
        "visibility"  VARCHAR NOT NULL DEFAULT 'personal',
        "created_by"  UUID NOT NULL,
        "usage_count" INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_macros_tenant" ON "ticket_macros"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ticket_macros_actions" ON "ticket_macros" USING GIN ("actions")
    `);

    // ── Chat Sessions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"         UUID NOT NULL,
        "contact_id"        UUID REFERENCES "contacts"("id") ON DELETE SET NULL,
        "agent_id"          UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "status"            VARCHAR NOT NULL DEFAULT 'waiting',
        "channel"           VARCHAR NOT NULL DEFAULT 'web_chat',
        "started_at"        TIMESTAMP NOT NULL,
        "first_response_at" TIMESTAMP,
        "ended_at"          TIMESTAMP,
        "ticket_id"         UUID REFERENCES "tickets"("id") ON DELETE SET NULL,
        "satisfaction"      VARCHAR,
        "metadata"          JSONB NOT NULL DEFAULT '{}'
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_tenant_status" ON "chat_sessions"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_tenant_agent" ON "chat_sessions"("tenant_id", "agent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_metadata" ON "chat_sessions" USING GIN ("metadata")
    `);

    // ── Chat Messages ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "session_id"  UUID NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "sender_type" VARCHAR NOT NULL,
        "sender_id"   VARCHAR,
        "body"        TEXT NOT NULL,
        "attachments" JSONB NOT NULL DEFAULT '[]',
        "created_at"  TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_session" ON "chat_messages"("session_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_attachments" ON "chat_messages" USING GIN ("attachments")
    `);

    // ── Survey Responses ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "survey_responses" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "contact_id"   UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "type"         VARCHAR NOT NULL,
        "score"        INTEGER NOT NULL,
        "comment"      TEXT,
        "trigger_type" VARCHAR NOT NULL,
        "trigger_id"   VARCHAR,
        "responded_at" TIMESTAMP NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_survey_responses_tenant_type" ON "survey_responses"("tenant_id", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_survey_responses_tenant_contact" ON "survey_responses"("tenant_id", "contact_id")
    `);

    // ══════════════════════════════════════════════════════════════════
    // CONTENT MODULE
    // ══════════════════════════════════════════════════════════════════

    // ── Content Categories ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "content_categories" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "slug"        VARCHAR NOT NULL,
        "description" TEXT,
        "parent_id"   UUID REFERENCES "content_categories"("id") ON DELETE SET NULL,
        "position"    INTEGER NOT NULL DEFAULT 0,
        "type"        VARCHAR NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_content_categories_tenant_type" ON "content_categories"("tenant_id", "type")
    `);

    // ── Asset Folders ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "asset_folders" (
        "id"        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "name"      VARCHAR NOT NULL,
        "parent_id" UUID REFERENCES "asset_folders"("id") ON DELETE SET NULL,
        "position"  INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_asset_folders_tenant" ON "asset_folders"("tenant_id")
    `);

    // ── Content Pages ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "content_pages" (
        "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"        UUID NOT NULL,
        "type"             VARCHAR NOT NULL,
        "title"            VARCHAR NOT NULL,
        "slug"             VARCHAR NOT NULL,
        "body_json"        JSONB NOT NULL,
        "body_html"        TEXT,
        "excerpt"          TEXT,
        "featured_image"   VARCHAR,
        "status"           VARCHAR NOT NULL DEFAULT 'draft',
        "author_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "parent_id"        UUID REFERENCES "content_pages"("id") ON DELETE SET NULL,
        "category_id"      UUID REFERENCES "content_categories"("id") ON DELETE SET NULL,
        "tags"             TEXT[] NOT NULL DEFAULT '{}',
        "seo_title"        VARCHAR,
        "seo_description"  TEXT,
        "og_image"         VARCHAR,
        "canonical_url"    VARCHAR,
        "published_at"     TIMESTAMP,
        "scheduled_at"     TIMESTAMP,
        "version"          INTEGER NOT NULL DEFAULT 1,
        "locale"           VARCHAR NOT NULL DEFAULT 'en',
        "view_count"       INTEGER NOT NULL DEFAULT 0,
        "word_count"       INTEGER NOT NULL DEFAULT 0,
        "reading_time_min" INTEGER NOT NULL DEFAULT 0,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_content_pages_tenant_status_type" ON "content_pages"("tenant_id", "status", "type")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_content_pages_tenant_slug" ON "content_pages"("tenant_id", "slug")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_content_pages_body_json" ON "content_pages" USING GIN ("body_json")
    `);

    // ── Content Versions ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "content_versions" (
        "id"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "page_id"        UUID NOT NULL REFERENCES "content_pages"("id") ON DELETE CASCADE,
        "version"        INTEGER NOT NULL,
        "body_json"      JSONB NOT NULL,
        "title"          VARCHAR NOT NULL,
        "changed_by"     UUID NOT NULL,
        "change_summary" VARCHAR,
        "created_at"     TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_content_versions_page" ON "content_versions"("page_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_content_versions_body_json" ON "content_versions" USING GIN ("body_json")
    `);

    // ── Assets ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "assets" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "filename"      VARCHAR NOT NULL,
        "original_name" VARCHAR NOT NULL,
        "mime_type"     VARCHAR NOT NULL,
        "size_bytes"    INTEGER NOT NULL,
        "s3_key"        VARCHAR NOT NULL,
        "cdn_url"       VARCHAR,
        "width"         INTEGER,
        "height"        INTEGER,
        "alt_text"      VARCHAR,
        "title"         VARCHAR,
        "folder_id"     UUID REFERENCES "asset_folders"("id") ON DELETE SET NULL,
        "tags"          TEXT[] NOT NULL DEFAULT '{}',
        "metadata"      JSONB NOT NULL DEFAULT '{}',
        "thumbnails"    JSONB NOT NULL DEFAULT '{}',
        "uploaded_by"   UUID NOT NULL,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assets_tenant" ON "assets"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assets_tenant_folder" ON "assets"("tenant_id", "folder_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assets_metadata" ON "assets" USING GIN ("metadata")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assets_thumbnails" ON "assets" USING GIN ("thumbnails")
    `);

    // ── Site Themes ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "site_themes" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "config"      JSONB NOT NULL,
        "header_json" JSONB,
        "footer_json" JSONB,
        "is_active"   BOOLEAN NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_site_themes_tenant" ON "site_themes"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_site_themes_config" ON "site_themes" USING GIN ("config")
    `);

    // ── Redirects ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "redirects" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"  UUID NOT NULL,
        "from_path"  VARCHAR NOT NULL,
        "to_path"    VARCHAR NOT NULL,
        "type"       INTEGER NOT NULL DEFAULT 301,
        "hit_count"  INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_redirects_tenant_from_path" ON "redirects"("tenant_id", "from_path")
    `);

    // ══════════════════════════════════════════════════════════════════
    // SALES SEQUENCES
    // ══════════════════════════════════════════════════════════════════

    // ── Sequences ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sequences" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "status"      VARCHAR NOT NULL DEFAULT 'draft',
        "created_by"  UUID NOT NULL,
        "settings"    JSONB NOT NULL DEFAULT '{}',
        "stats_cache" JSONB NOT NULL DEFAULT '{}',
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequences_tenant_status" ON "sequences"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequences_settings" ON "sequences" USING GIN ("settings")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequences_stats_cache" ON "sequences" USING GIN ("stats_cache")
    `);

    // ── Sequence Steps ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sequence_steps" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sequence_id" UUID NOT NULL REFERENCES "sequences"("id") ON DELETE CASCADE,
        "position"    INTEGER NOT NULL,
        "type"        VARCHAR NOT NULL,
        "delay_days"  INTEGER NOT NULL DEFAULT 0,
        "delay_hours" INTEGER NOT NULL DEFAULT 0,
        "config"      JSONB NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequence_steps_sequence" ON "sequence_steps"("sequence_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequence_steps_config" ON "sequence_steps" USING GIN ("config")
    `);

    // ── Sequence Enrollments ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sequence_enrollments" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sequence_id"  UUID NOT NULL REFERENCES "sequences"("id") ON DELETE CASCADE,
        "contact_id"   UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "enrolled_by"  UUID NOT NULL,
        "current_step" INTEGER NOT NULL DEFAULT 0,
        "status"       VARCHAR NOT NULL DEFAULT 'active',
        "enrolled_at"  TIMESTAMP NOT NULL,
        "completed_at" TIMESTAMP,
        "exit_reason"  VARCHAR
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequence_enrollments_sequence" ON "sequence_enrollments"("sequence_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequence_enrollments_contact" ON "sequence_enrollments"("contact_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sequence_enrollments_status"
        ON "sequence_enrollments"("status")
        WHERE "status" = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Sales Sequences
    await queryRunner.query(`DROP TABLE IF EXISTS "sequence_enrollments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sequence_steps" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sequences" CASCADE`);

    // Content
    await queryRunner.query(`DROP TABLE IF EXISTS "redirects" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_themes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_versions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_pages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_folders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_categories" CASCADE`);

    // Service
    await queryRunner.query(`DROP TABLE IF EXISTS "survey_responses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_macros" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tickets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sla_policies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "business_hours" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ticket_categories" CASCADE`);
  }
}
