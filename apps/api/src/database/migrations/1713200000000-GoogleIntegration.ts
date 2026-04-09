import { MigrationInterface, QueryRunner } from 'typeorm';

export class GoogleIntegration1713200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE google_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        google_email varchar NOT NULL,
        access_token text NOT NULL,
        refresh_token text NOT NULL,
        token_expiry timestamp NOT NULL,
        scopes text NOT NULL DEFAULT '',
        gmail_history_id varchar,
        gmail_last_sync_at timestamp,
        calendar_sync_token varchar,
        calendar_last_sync_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE email_sync_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        google_message_id varchar NOT NULL,
        activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
        synced_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id, google_message_id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_email_sync_log_user ON email_sync_log(user_id, google_message_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_email_sync_log_user;`);
    await queryRunner.query(`DROP TABLE IF EXISTS email_sync_log;`);
    await queryRunner.query(`DROP TABLE IF EXISTS google_connections;`);
  }
}
