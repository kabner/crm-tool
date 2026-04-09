import { MigrationInterface, QueryRunner } from 'typeorm';

export class PipelineCustomFields1713100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE pipeline_fields (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        field_key varchar NOT NULL,
        field_type varchar NOT NULL DEFAULT 'text',
        options jsonb,
        required boolean NOT NULL DEFAULT false,
        position integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(pipeline_id, field_key)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_pipeline_fields_pipeline ON pipeline_fields(pipeline_id, position)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS pipeline_fields`);
  }
}
