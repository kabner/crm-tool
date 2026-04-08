import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectPipelines1712600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE pipelines ADD COLUMN type varchar NOT NULL DEFAULT 'sales'
    `);
    await queryRunner.query(`
      CREATE INDEX idx_pipelines_tenant_type ON pipelines(tenant_id, type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pipelines_tenant_type`);
    await queryRunner.query(`ALTER TABLE pipelines DROP COLUMN IF EXISTS type`);
  }
}
