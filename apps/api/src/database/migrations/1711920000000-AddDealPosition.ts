import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDealPosition1711920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "deals" DROP COLUMN IF EXISTS "position"`);
  }
}
