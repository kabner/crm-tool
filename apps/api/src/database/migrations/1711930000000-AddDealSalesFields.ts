import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealSalesFields1711930000000 implements MigrationInterface {
  name = 'AddDealSalesFields1711930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deals
      ADD COLUMN IF NOT EXISTS last_stage_change_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'none'
    `);

    await queryRunner.query(`
      UPDATE deals SET last_stage_change_at = COALESCE(updated_at, NOW()) WHERE last_stage_change_at IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE deals ALTER COLUMN last_stage_change_at SET DEFAULT NOW()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE deals
      DROP COLUMN IF EXISTS last_stage_change_at,
      DROP COLUMN IF EXISTS last_activity_at,
      DROP COLUMN IF EXISTS priority
    `);
  }
}
