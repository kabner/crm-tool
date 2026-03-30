import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'crm',
  password: process.env.DATABASE_PASSWORD || 'localdev',
  database: process.env.DATABASE_NAME || 'crm_dev',
  synchronize: false,
  migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
  entities: [], // Don't load entities — migrations use raw SQL
});

async function run() {
  await dataSource.initialize();
  console.log('Connected to database');
  await dataSource.runMigrations();
  console.log('Migrations complete');
  await dataSource.destroy();
}

run().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
