import { MigrationInterface, QueryRunner } from 'typeorm';

export class MarketingSchema1711700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Email Templates ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "email_templates" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "name"          VARCHAR NOT NULL,
        "category"      VARCHAR,
        "content_json"  JSONB NOT NULL,
        "content_html"  TEXT NOT NULL,
        "thumbnail_url" VARCHAR,
        "is_system"     BOOLEAN NOT NULL DEFAULT false,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_templates_tenant" ON "email_templates"("tenant_id")
    `);

    // ── Campaigns ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "type"         VARCHAR NOT NULL,
        "status"       VARCHAR NOT NULL DEFAULT 'draft',
        "start_date"   TIMESTAMP,
        "end_date"     TIMESTAMP,
        "budget"       DECIMAL,
        "actual_spend" DECIMAL,
        "owner_id"     UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "settings"     JSONB NOT NULL DEFAULT '{}',
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_campaigns_tenant_status" ON "campaigns"("tenant_id", "status")
    `);

    // ── Marketing Emails ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "marketing_emails" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"       UUID NOT NULL,
        "name"            VARCHAR NOT NULL,
        "subject"         VARCHAR NOT NULL,
        "preview_text"    VARCHAR,
        "from_name"       VARCHAR NOT NULL,
        "from_email"      VARCHAR NOT NULL,
        "reply_to"        VARCHAR,
        "content_html"    TEXT NOT NULL,
        "content_json"    JSONB NOT NULL,
        "template_id"     UUID REFERENCES "email_templates"("id") ON DELETE SET NULL,
        "status"          VARCHAR NOT NULL DEFAULT 'draft',
        "send_type"       VARCHAR NOT NULL,
        "scheduled_at"    TIMESTAMP,
        "sent_at"         TIMESTAMP,
        "ab_test_config"  JSONB,
        "stats_cache"     JSONB NOT NULL DEFAULT '{}',
        "campaign_id"     UUID REFERENCES "campaigns"("id") ON DELETE SET NULL,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_marketing_emails_tenant_status" ON "marketing_emails"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_marketing_emails_tenant_campaign" ON "marketing_emails"("tenant_id", "campaign_id")
    `);

    // ── Email Sends ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "email_sends" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"       UUID NOT NULL,
        "email_id"        UUID NOT NULL REFERENCES "marketing_emails"("id") ON DELETE CASCADE,
        "contact_id"      UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "variant"         VARCHAR,
        "status"          VARCHAR NOT NULL,
        "sent_at"         TIMESTAMP,
        "delivered_at"    TIMESTAMP,
        "opened_at"       TIMESTAMP,
        "open_count"      INTEGER NOT NULL DEFAULT 0,
        "clicked_at"      TIMESTAMP,
        "click_count"     INTEGER NOT NULL DEFAULT 0,
        "unsubscribed_at" TIMESTAMP,
        "bounced_at"      TIMESTAMP,
        "bounce_type"     VARCHAR,
        "message_id"      VARCHAR,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_sends_tenant_email" ON "email_sends"("tenant_id", "email_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_sends_tenant_contact" ON "email_sends"("tenant_id", "contact_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_email_sends_message_id" ON "email_sends"("message_id")
    `);

    // ── Workflows ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "workflows" (
        "id"             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"      UUID NOT NULL,
        "name"           VARCHAR NOT NULL,
        "description"    VARCHAR,
        "status"         VARCHAR NOT NULL DEFAULT 'draft',
        "trigger_config" JSONB NOT NULL,
        "version"        INTEGER NOT NULL DEFAULT 1,
        "created_by"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "published_at"   TIMESTAMP,
        "stats_cache"    JSONB NOT NULL DEFAULT '{}',
        "created_at"     TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflows_tenant_status" ON "workflows"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflows_trigger_config" ON "workflows" USING GIN ("trigger_config")
    `);

    // ── Workflow Nodes ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "workflow_nodes" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "workflow_id" UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "type"        VARCHAR NOT NULL,
        "config"      JSONB NOT NULL,
        "position_x"  INTEGER NOT NULL DEFAULT 0,
        "position_y"  INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflow_nodes_workflow" ON "workflow_nodes"("workflow_id")
    `);

    // ── Workflow Edges ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "workflow_edges" (
        "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "workflow_id"      UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "from_node_id"     UUID NOT NULL REFERENCES "workflow_nodes"("id") ON DELETE CASCADE,
        "to_node_id"       UUID NOT NULL REFERENCES "workflow_nodes"("id") ON DELETE CASCADE,
        "condition_branch" VARCHAR
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflow_edges_workflow" ON "workflow_edges"("workflow_id")
    `);

    // ── Workflow Enrollments ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "workflow_enrollments" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"       UUID NOT NULL,
        "workflow_id"     UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
        "contact_id"      UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "current_node_id" UUID REFERENCES "workflow_nodes"("id") ON DELETE SET NULL,
        "status"          VARCHAR NOT NULL DEFAULT 'active',
        "enrolled_at"     TIMESTAMP NOT NULL,
        "completed_at"    TIMESTAMP,
        "next_action_at"  TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflow_enrollments_tenant_workflow"
        ON "workflow_enrollments"("tenant_id", "workflow_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflow_enrollments_tenant_contact"
        ON "workflow_enrollments"("tenant_id", "contact_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workflow_enrollments_next_action"
        ON "workflow_enrollments"("next_action_at")
        WHERE "status" = 'active' AND "next_action_at" IS NOT NULL
    `);

    // ── Forms ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "forms" (
        "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"        UUID NOT NULL,
        "name"             VARCHAR NOT NULL,
        "status"           VARCHAR NOT NULL DEFAULT 'draft',
        "fields"           JSONB NOT NULL,
        "settings"         JSONB NOT NULL,
        "embed_code"       TEXT,
        "submission_count" INTEGER NOT NULL DEFAULT 0,
        "campaign_id"      UUID REFERENCES "campaigns"("id") ON DELETE SET NULL,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_forms_tenant_status" ON "forms"("tenant_id", "status")
    `);

    // ── Form Submissions ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "form_submissions" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "form_id"       UUID NOT NULL REFERENCES "forms"("id") ON DELETE CASCADE,
        "contact_id"    UUID REFERENCES "contacts"("id") ON DELETE SET NULL,
        "data"          JSONB NOT NULL,
        "page_url"      VARCHAR,
        "referrer"      VARCHAR,
        "utm_params"    JSONB,
        "ip_address"    VARCHAR,
        "submitted_at"  TIMESTAMP NOT NULL,
        "consent_given" BOOLEAN NOT NULL DEFAULT false
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_form_submissions_tenant_form"
        ON "form_submissions"("tenant_id", "form_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_form_submissions_tenant_contact"
        ON "form_submissions"("tenant_id", "contact_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_form_submissions_data" ON "form_submissions" USING GIN ("data")
    `);

    // ── Page Views ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "page_views" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "contact_id"   UUID REFERENCES "contacts"("id") ON DELETE SET NULL,
        "session_id"   VARCHAR,
        "page_url"     VARCHAR NOT NULL,
        "page_title"   VARCHAR,
        "referrer"     VARCHAR,
        "utm_source"   VARCHAR,
        "utm_medium"   VARCHAR,
        "utm_campaign" VARCHAR,
        "utm_content"  VARCHAR,
        "utm_term"     VARCHAR,
        "duration_ms"  INTEGER,
        "viewed_at"    TIMESTAMP NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_page_views_tenant_contact" ON "page_views"("tenant_id", "contact_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_page_views_tenant_viewed_at" ON "page_views"("tenant_id", "viewed_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_page_views_session" ON "page_views"("session_id")
    `);

    // ── Lead Score Models ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lead_score_models" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "name"          VARCHAR NOT NULL,
        "mql_threshold" INTEGER NOT NULL DEFAULT 50,
        "sql_threshold" INTEGER NOT NULL DEFAULT 80,
        "is_default"    BOOLEAN NOT NULL DEFAULT false,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lead_score_models_tenant" ON "lead_score_models"("tenant_id")
    `);

    // ── Lead Score Rules ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lead_score_rules" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "model_id"      UUID NOT NULL REFERENCES "lead_score_models"("id") ON DELETE CASCADE,
        "type"          VARCHAR NOT NULL,
        "attribute"     VARCHAR NOT NULL,
        "condition"     JSONB NOT NULL,
        "points"        INTEGER NOT NULL,
        "decay_per_day" DECIMAL NOT NULL DEFAULT 0,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lead_score_rules_model" ON "lead_score_rules"("model_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lead_score_rules_condition" ON "lead_score_rules" USING GIN ("condition")
    `);

    // ── Lead Scores ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lead_scores" (
        "id"                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "contact_id"         UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "model_id"           UUID NOT NULL REFERENCES "lead_score_models"("id") ON DELETE CASCADE,
        "score"              INTEGER NOT NULL DEFAULT 0,
        "last_calculated_at" TIMESTAMP NOT NULL,
        "score_breakdown"    JSONB NOT NULL DEFAULT '{}'
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_lead_scores_contact_model"
        ON "lead_scores"("contact_id", "model_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lead_scores_score" ON "lead_scores"("score")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lead_scores_breakdown" ON "lead_scores" USING GIN ("score_breakdown")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "lead_scores" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lead_score_rules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lead_score_models" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "page_views" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "form_submissions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "forms" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_enrollments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_edges" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflow_nodes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "workflows" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_sends" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_emails" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaigns" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "email_templates" CASCADE`);
  }
}
