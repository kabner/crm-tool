import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecordAttachments1712400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE record_attachments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        entity_type varchar NOT NULL,
        entity_id uuid NOT NULL,
        file_name varchar NOT NULL,
        file_size integer NOT NULL DEFAULT 0,
        mime_type varchar NOT NULL DEFAULT 'application/octet-stream',
        file_url varchar NOT NULL,
        uploaded_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_record_attachments_entity ON record_attachments(entity_type, entity_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS record_attachments`);
  }
}
