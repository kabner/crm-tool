import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USER', 'crm'),
  password: configService.get<string>('DATABASE_PASSWORD', 'localdev'),
  database: configService.get<string>('DATABASE_NAME', 'crm_dev'),
  autoLoadEntities: true,
  synchronize: false,
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
});

/**
 * DataSource instance for TypeORM CLI commands (migrations, seeding).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'crm',
  password: process.env.DATABASE_PASSWORD || 'localdev',
  database: process.env.DATABASE_NAME || 'crm_dev',
  synchronize: false,
  migrations: [path.join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
} as DataSourceOptions);
