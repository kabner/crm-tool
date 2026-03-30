import { MigrationInterface, QueryRunner } from 'typeorm';

export class KnowledgeBase1711810000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── KB Categories ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kb_categories" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"   UUID NOT NULL,
        "name"        VARCHAR NOT NULL,
        "slug"        VARCHAR NOT NULL,
        "description" TEXT,
        "icon"        VARCHAR,
        "position"    INTEGER NOT NULL DEFAULT 0,
        "visibility"  VARCHAR NOT NULL DEFAULT 'public',
        "created_at"  TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kb_categories_tenant" ON "kb_categories"("tenant_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_kb_categories_tenant_slug" ON "kb_categories"("tenant_id", "slug")
    `);

    // ── KB Sections ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kb_sections" (
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "category_id" UUID NOT NULL REFERENCES "kb_categories"("id") ON DELETE CASCADE,
        "name"        VARCHAR NOT NULL,
        "slug"        VARCHAR NOT NULL,
        "description" TEXT,
        "position"    INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kb_sections_category" ON "kb_sections"("category_id")
    `);

    // ── KB Articles ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "kb_articles" (
        "id"                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"         UUID NOT NULL,
        "section_id"        UUID NOT NULL REFERENCES "kb_sections"("id") ON DELETE CASCADE,
        "title"             VARCHAR NOT NULL,
        "slug"              VARCHAR NOT NULL,
        "body_html"         TEXT NOT NULL,
        "body_json"         JSONB,
        "status"            VARCHAR NOT NULL DEFAULT 'draft',
        "author_id"         UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "visibility"        VARCHAR NOT NULL DEFAULT 'public',
        "seo_title"         VARCHAR,
        "seo_description"   TEXT,
        "helpful_count"     INTEGER NOT NULL DEFAULT 0,
        "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
        "view_count"        INTEGER NOT NULL DEFAULT 0,
        "position"          INTEGER NOT NULL DEFAULT 0,
        "published_at"      TIMESTAMP,
        "version"           INTEGER NOT NULL DEFAULT 1,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kb_articles_tenant_status" ON "kb_articles"("tenant_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_kb_articles_section" ON "kb_articles"("section_id")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_kb_articles_tenant_slug" ON "kb_articles"("tenant_id", "slug")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "kb_articles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kb_sections" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kb_categories" CASCADE`);
  }
}
