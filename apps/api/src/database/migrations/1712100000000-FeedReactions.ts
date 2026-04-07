import { MigrationInterface, QueryRunner } from 'typeorm';

export class FeedReactions1712100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE feed_reactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type varchar NOT NULL,
        entity_id uuid NOT NULL,
        emoji varchar NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id, entity_type, entity_id, emoji)
      );
    `);
    await queryRunner.query(`
      CREATE INDEX idx_feed_reactions_entity ON feed_reactions(entity_type, entity_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS feed_reactions`);
  }
}
