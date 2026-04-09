import { MigrationInterface, QueryRunner } from 'typeorm';

export class Leads1712500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE leads (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        first_name varchar NOT NULL,
        last_name varchar NOT NULL,
        email varchar,
        phone varchar,
        company_name varchar,
        job_title varchar,
        source varchar,
        status varchar NOT NULL DEFAULT 'new',
        owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
        score integer NOT NULL DEFAULT 0,
        notes text,
        custom_props jsonb NOT NULL DEFAULT '{}',
        converted_at timestamp,
        converted_contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
        converted_deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
        created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_leads_tenant_email ON leads(tenant_id, email)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS leads`);
  }
}
