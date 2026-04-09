import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiCurrency1713000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add currency column to deals (default USD)
    await queryRunner.query(`ALTER TABLE deals ADD COLUMN currency varchar NOT NULL DEFAULT 'USD'`);

    // Add currency to products
    await queryRunner.query(`ALTER TABLE products ADD COLUMN currency varchar NOT NULL DEFAULT 'USD'`);

    // Create exchange rates table for conversion
    await queryRunner.query(`
      CREATE TABLE exchange_rates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        from_currency varchar NOT NULL,
        to_currency varchar NOT NULL,
        rate decimal(18,8) NOT NULL,
        updated_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, from_currency, to_currency)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS exchange_rates`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN IF EXISTS currency`);
    await queryRunner.query(`ALTER TABLE deals DROP COLUMN IF EXISTS currency`);
  }
}
