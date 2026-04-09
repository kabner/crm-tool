import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecordVisibility1712800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // visibility values: 'everyone' (default), 'owner', 'private'
    // 'everyone' = all tenant users can see
    // 'owner' = only the owner/creator can see
    // 'private' = only specific users (future: via sharing table, for now same as owner)
    await queryRunner.query(`ALTER TABLE contacts ADD COLUMN visibility varchar NOT NULL DEFAULT 'everyone'`);
    await queryRunner.query(`ALTER TABLE companies ADD COLUMN visibility varchar NOT NULL DEFAULT 'everyone'`);
    await queryRunner.query(`ALTER TABLE deals ADD COLUMN visibility varchar NOT NULL DEFAULT 'everyone'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS visibility`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS visibility`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS visibility`);
  }
}
