import { MigrationInterface, QueryRunner } from 'typeorm';

export class Subtasks1712300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE activities ADD COLUMN parent_id uuid REFERENCES activities(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE INDEX idx_activities_parent ON activities(parent_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_activities_parent`);
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN IF EXISTS parent_id`);
  }
}
