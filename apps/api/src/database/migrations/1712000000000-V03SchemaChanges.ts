import { MigrationInterface, QueryRunner } from 'typeorm';

export class V03SchemaChanges1712000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add lifecycle_stage to companies
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "lifecycle_stage" VARCHAR NOT NULL DEFAULT 'lead'`,
    );

    // 2. Add created_by_id to contacts
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "created_by_id" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL`,
    );

    // 3. Add created_by_id to companies
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "created_by_id" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "FK_companies_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL`,
    );

    // 4. Backfill created_by_id from owner_id for existing records
    await queryRunner.query(
      `UPDATE "contacts" SET "created_by_id" = "owner_id" WHERE "created_by_id" IS NULL AND "owner_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "companies" SET "created_by_id" = "owner_id" WHERE "created_by_id" IS NULL AND "owner_id" IS NOT NULL`,
    );

    // 5. Migrate lifecycle_stage from contacts to companies via contact_companies
    // Use the most recently updated contact's stage per company
    await queryRunner.query(`
      UPDATE "companies" c
      SET "lifecycle_stage" = sub."lifecycle_stage"
      FROM (
        SELECT DISTINCT ON (cc."company_id")
          cc."company_id",
          ct."lifecycle_stage"
        FROM "contact_companies" cc
        JOIN "contacts" ct ON ct."id" = cc."contact_id"
        WHERE ct."lifecycle_stage" IS NOT NULL
        ORDER BY cc."company_id", ct."updated_at" DESC
      ) sub
      WHERE c."id" = sub."company_id"
    `);

    // 6. Add company_id to contacts
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "company_id" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL`,
    );

    // 7. Backfill company_id from existing contact_companies (first association per contact)
    await queryRunner.query(`
      UPDATE "contacts" ct
      SET "company_id" = sub."company_id"
      FROM (
        SELECT DISTINCT ON (cc."contact_id")
          cc."contact_id",
          cc."company_id"
        FROM "contact_companies" cc
        ORDER BY cc."contact_id", cc."created_at" ASC
      ) sub
      WHERE ct."id" = sub."contact_id"
    `);

    // 8. Create user_favorites table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_favorites" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "entity_type" VARCHAR NOT NULL,
        "entity_id" UUID NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_favorites_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_favorites_user_entity" UNIQUE ("user_id", "entity_type", "entity_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_favorites_user_type" ON "user_favorites" ("user_id", "entity_type")`,
    );

    // 9. Create user_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_settings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "section" VARCHAR NOT NULL,
        "settings" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_settings_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_settings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_settings_user_section" UNIQUE ("user_id", "section")
      )
    `);

    // 10. Drop lifecycle_stage from contacts (data already migrated to companies)
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP COLUMN IF EXISTS "lifecycle_stage"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse step 10: Re-add lifecycle_stage to contacts
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "lifecycle_stage" VARCHAR DEFAULT 'lead'`,
    );

    // Reverse step 9: Drop user_settings
    await queryRunner.query(`DROP TABLE IF EXISTS "user_settings"`);

    // Reverse step 8: Drop user_favorites
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_favorites_user_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_favorites"`);

    // Reverse step 7: (backfill is data-only, no structural rollback needed)

    // Reverse step 6: Drop company_id from contacts
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "FK_contacts_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP COLUMN IF EXISTS "company_id"`,
    );

    // Reverse step 5: (data migration, no structural rollback needed)

    // Reverse step 4: (backfill is data-only, no structural rollback needed)

    // Reverse step 3: Drop created_by_id from companies
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "FK_companies_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "created_by_id"`,
    );

    // Reverse step 2: Drop created_by_id from contacts
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "FK_contacts_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP COLUMN IF EXISTS "created_by_id"`,
    );

    // Reverse step 1: Drop lifecycle_stage from companies
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN IF EXISTS "lifecycle_stage"`,
    );
  }
}
