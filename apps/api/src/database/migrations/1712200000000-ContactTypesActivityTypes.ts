import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactTypesActivityTypes1712200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE contact_type_options (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        color varchar NOT NULL DEFAULT 'gray',
        position integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_contact_type_options_tenant ON contact_type_options(tenant_id, position)`);

    await queryRunner.query(`
      CREATE TABLE activity_type_options (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        slug varchar NOT NULL,
        icon varchar NOT NULL DEFAULT 'circle',
        color varchar NOT NULL DEFAULT 'gray',
        is_interaction boolean NOT NULL DEFAULT true,
        is_system boolean NOT NULL DEFAULT false,
        position integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, slug)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_activity_type_options_tenant ON activity_type_options(tenant_id, position)`);

    await queryRunner.query(`ALTER TABLE contacts ADD COLUMN contact_type varchar`);

    // Seed defaults for all existing tenants
    await queryRunner.query(`
      INSERT INTO contact_type_options (tenant_id, name, color, position)
      SELECT t.id, v.name, v.color, v.position
      FROM tenants t
      CROSS JOIN (VALUES
        ('Customer', 'green', 0), ('Prospect', 'blue', 1), ('Partner', 'purple', 2),
        ('Vendor', 'orange', 3), ('Competitor', 'red', 4), ('Other', 'gray', 5)
      ) AS v(name, color, position)
    `);

    await queryRunner.query(`
      INSERT INTO activity_type_options (tenant_id, name, slug, icon, color, is_interaction, is_system, position)
      SELECT t.id, v.name, v.slug, v.icon, v.color, v.is_interaction, true, v.position
      FROM tenants t
      CROSS JOIN (VALUES
        ('Note', 'note', 'file-text', 'gray', false, 0),
        ('Task', 'task', 'check-square', 'blue', false, 1),
        ('Call', 'call', 'phone', 'green', true, 2),
        ('Email', 'email', 'mail', 'purple', true, 3),
        ('Meeting', 'meeting', 'calendar', 'orange', true, 4)
      ) AS v(name, slug, icon, color, is_interaction, position)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS contact_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS activity_type_options`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_type_options`);
  }
}
