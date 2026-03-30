import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1711600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id"     UUID NOT NULL,
        "user_id"       UUID NOT NULL,
        "type"          VARCHAR NOT NULL,
        "title"         VARCHAR NOT NULL,
        "body"          VARCHAR NOT NULL,
        "action_url"    VARCHAR,
        "resource_type" VARCHAR,
        "resource_id"   VARCHAR,
        "actor_id"      VARCHAR,
        "read_at"       TIMESTAMP,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_unread"
        ON "notifications"("tenant_id", "user_id", "read_at", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
  }
}
