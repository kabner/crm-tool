import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Tenants ──────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name"              VARCHAR NOT NULL,
        "domain"            VARCHAR,
        "plan"              VARCHAR NOT NULL DEFAULT 'free',
        "settings"          JSONB NOT NULL DEFAULT '{}',
        "security_settings" JSONB NOT NULL DEFAULT '{}',
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Users ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "email"         VARCHAR NOT NULL,
        "password_hash" VARCHAR NOT NULL,
        "first_name"    VARCHAR NOT NULL,
        "last_name"     VARCHAR NOT NULL,
        "status"        VARCHAR NOT NULL DEFAULT 'active',
        "mfa_enabled"   BOOLEAN NOT NULL DEFAULT false,
        "last_login_at" TIMESTAMP,
        "avatar_url"    VARCHAR,
        "timezone"      VARCHAR NOT NULL DEFAULT 'UTC',
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_tenant_email" ON "users"("tenant_id", "email")
    `);

    // ── Roles ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"           UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "name"                VARCHAR NOT NULL,
        "description"         VARCHAR,
        "is_system"           BOOLEAN NOT NULL DEFAULT false,
        "permissions"         JSONB NOT NULL DEFAULT '{}',
        "record_access_level" VARCHAR NOT NULL DEFAULT 'own',
        "created_at"          TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_roles_tenant_name" ON "roles"("tenant_id", "name")
    `);

    // ── User Roles ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id"    UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "granted_at" TIMESTAMP NOT NULL DEFAULT now(),
        "granted_by" UUID
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_roles_user_role" ON "user_roles"("user_id", "role_id")
    `);

    // ── Sessions ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id"            UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "refresh_token_hash" VARCHAR NOT NULL,
        "ip_address"         VARCHAR,
        "user_agent"         VARCHAR,
        "created_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "last_used_at"       TIMESTAMP NOT NULL DEFAULT now(),
        "expires_at"         TIMESTAMP NOT NULL,
        "revoked_at"         TIMESTAMP
      )
    `);

    // ── Contacts ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "contacts" (
        "id"               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"        UUID NOT NULL,
        "first_name"       VARCHAR NOT NULL,
        "last_name"        VARCHAR NOT NULL,
        "email"            VARCHAR,
        "phone"            VARCHAR,
        "job_title"        VARCHAR,
        "lifecycle_stage"  VARCHAR NOT NULL DEFAULT 'lead',
        "lead_status"      VARCHAR,
        "owner_id"         UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "tags"             TEXT[] NOT NULL DEFAULT '{}',
        "custom_props"     JSONB NOT NULL DEFAULT '{}',
        "source"           VARCHAR,
        "last_activity_at" TIMESTAMP,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_contacts_tenant_email" ON "contacts"("tenant_id", "email")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_contacts_tenant_name" ON "contacts"("tenant_id", "last_name", "first_name")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_contacts_custom_props" ON "contacts" USING GIN ("custom_props")
    `);

    // ── Companies ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "domain"       VARCHAR,
        "industry"     VARCHAR,
        "size"         VARCHAR,
        "phone"        VARCHAR,
        "address"      JSONB,
        "owner_id"     UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "parent_id"    UUID REFERENCES "companies"("id") ON DELETE SET NULL,
        "custom_props" JSONB NOT NULL DEFAULT '{}',
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_companies_tenant_domain" ON "companies"("tenant_id", "domain")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_companies_tenant_name" ON "companies"("tenant_id", "name")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_companies_custom_props" ON "companies" USING GIN ("custom_props")
    `);

    // ── Contact–Company join ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "contact_companies" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "contact_id" UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "is_primary" BOOLEAN NOT NULL DEFAULT false,
        "role"       VARCHAR,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_contact_companies_contact_company"
        ON "contact_companies"("contact_id", "company_id")
    `);

    // ── Pipelines ────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pipelines" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"  UUID NOT NULL,
        "name"       VARCHAR NOT NULL,
        "is_default" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Deal Stages ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "deal_stages" (
        "id"              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "pipeline_id"     UUID NOT NULL REFERENCES "pipelines"("id") ON DELETE CASCADE,
        "name"            VARCHAR NOT NULL,
        "position"        INTEGER NOT NULL,
        "probability"     NUMERIC NOT NULL DEFAULT 0,
        "stage_type"      VARCHAR NOT NULL DEFAULT 'open',
        "required_fields" TEXT[] NOT NULL DEFAULT '{}',
        "created_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Deals ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "deals" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "name"         VARCHAR NOT NULL,
        "amount"       DECIMAL,
        "stage_id"     UUID NOT NULL REFERENCES "deal_stages"("id") ON DELETE RESTRICT,
        "pipeline_id"  UUID NOT NULL REFERENCES "pipelines"("id") ON DELETE RESTRICT,
        "close_date"   DATE,
        "owner_id"     UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "company_id"   UUID REFERENCES "companies"("id") ON DELETE SET NULL,
        "won"          BOOLEAN,
        "lost_reason"  VARCHAR,
        "custom_props" JSONB NOT NULL DEFAULT '{}',
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_deals_custom_props" ON "deals" USING GIN ("custom_props")
    `);

    // ── Activities ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "activities" (
        "id"           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"    UUID NOT NULL,
        "type"         VARCHAR NOT NULL,
        "subject"      VARCHAR NOT NULL,
        "body"         TEXT,
        "contact_id"   UUID REFERENCES "contacts"("id") ON DELETE SET NULL,
        "company_id"   UUID REFERENCES "companies"("id") ON DELETE SET NULL,
        "deal_id"      UUID REFERENCES "deals"("id") ON DELETE SET NULL,
        "user_id"      UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "due_date"     TIMESTAMP,
        "completed_at" TIMESTAMP,
        "metadata"     JSONB NOT NULL DEFAULT '{}',
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_tenant_contact_created"
        ON "activities"("tenant_id", "contact_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_tenant_company_created"
        ON "activities"("tenant_id", "company_id", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_activities_tenant_deal_created"
        ON "activities"("tenant_id", "deal_id", "created_at")
    `);

    // ── Custom Properties ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "custom_properties" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "object_type"   VARCHAR NOT NULL,
        "name"          VARCHAR NOT NULL,
        "label"         VARCHAR NOT NULL,
        "field_type"    VARCHAR NOT NULL,
        "options"       JSONB,
        "group"         VARCHAR,
        "required"      BOOLEAN NOT NULL DEFAULT false,
        "default_value" VARCHAR,
        "position"      INTEGER NOT NULL DEFAULT 0,
        "archived"      BOOLEAN NOT NULL DEFAULT false,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_custom_properties_tenant_object_name"
        ON "custom_properties"("tenant_id", "object_type", "name")
    `);

    // ── Lists ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "lists" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"  UUID NOT NULL,
        "name"       VARCHAR NOT NULL,
        "type"       VARCHAR NOT NULL,
        "filters"    JSONB,
        "created_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── List Memberships ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "list_memberships" (
        "id"         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "list_id"    UUID NOT NULL REFERENCES "lists"("id") ON DELETE CASCADE,
        "contact_id" UUID NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "added_at"   TIMESTAMP NOT NULL DEFAULT now(),
        "source"     VARCHAR
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_list_memberships_list_contact"
        ON "list_memberships"("list_id", "contact_id")
    `);

    // ── Saved Views ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "saved_views" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "user_id"     UUID,
        "object_type" VARCHAR NOT NULL,
        "name"        VARCHAR NOT NULL,
        "filters"     JSONB NOT NULL DEFAULT '{}',
        "columns"     JSONB NOT NULL DEFAULT '[]',
        "sort"        JSONB NOT NULL DEFAULT '{}',
        "view_type"   VARCHAR NOT NULL,
        "is_default"  BOOLEAN NOT NULL DEFAULT false,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // ── Audit Logs ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "user_id"       UUID,
        "action"        VARCHAR NOT NULL,
        "resource_type" VARCHAR NOT NULL,
        "resource_id"   VARCHAR,
        "changes"       JSONB,
        "ip_address"    VARCHAR,
        "user_agent"    VARCHAR,
        "request_id"    VARCHAR,
        "metadata"      JSONB,
        "occurred_at"   TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_views" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "list_memberships" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lists" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_properties" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activities" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deals" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deal_stages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pipelines" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants" CASCADE`);
  }
}
