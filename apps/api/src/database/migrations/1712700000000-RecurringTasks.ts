import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecurringTasks1712700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE activities ADD COLUMN recurrence_rule varchar;
    `);
    await queryRunner.query(`
      ALTER TABLE activities ADD COLUMN recurrence_end_date timestamp;
    `);
    await queryRunner.query(`
      ALTER TABLE activities ADD COLUMN recurring_source_id uuid REFERENCES activities(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN recurring_source_id;`);
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN recurrence_end_date;`);
    await queryRunner.query(`ALTER TABLE activities DROP COLUMN recurrence_rule;`);
  }
}
