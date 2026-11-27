import * as fs from 'node:fs';
import * as path from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import * as mysql from 'mysql2/promise';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { dataSourceOptions } from '../../src/database/data-source.js';

export interface E2ETestContext {
  app: NestExpressApplication;
  dataSource: DataSource;
}

/**
 * Ensures the isolated test database exists and executes all pending TypeORM migrations.
 */
async function ensureTestDatabaseMigrated(): Promise<void> {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || '123456';
  const database = process.env.DB_NAME || 'realworld_nest_test';

  if (!database.includes('test')) {
    throw new Error(
      `Refusing to run E2E migrations on non-test database "${database}"`,
    );
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  } finally {
    await connection.end();
  }

  const migrationDataSource = new DataSource({
    ...dataSourceOptions,
    database,
    migrations: [
      path.join(process.cwd(), 'src', 'database', 'migrations', '*.ts'),
    ],
  });

  await migrationDataSource.initialize();
  try {
    await migrationDataSource.runMigrations();
  } finally {
    await migrationDataSource.destroy();
  }
}

/**
 * Boots a NestExpressApplication configured identically to main.ts against the test DB.
 */
export async function createE2EApp(): Promise<E2ETestContext> {
  await ensureTestDatabaseMigrated();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.setGlobalPrefix('api');

  const uploadsPath = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

/**
 * Truncates all entity and join tables in the test database so every test case runs in isolation.
 */
export async function truncateDatabase(dataSource: DataSource): Promise<void> {
  const dbName = String(dataSource.options.database ?? '');
  if (process.env.NODE_ENV !== 'test' || !dbName.includes('test')) {
    throw new Error(
      `Refusing to truncate database "${dbName}" outside NODE_ENV=test`,
    );
  }

  const tableNames = new Set<string>();
  for (const metadata of dataSource.entityMetadatas) {
    tableNames.add(metadata.tableName);
    for (const relation of metadata.manyToManyRelations) {
      if (relation.joinTableName) {
        tableNames.add(relation.joinTableName);
      }
    }
  }

  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const tableName of tableNames) {
      await dataSource.query(`TRUNCATE TABLE \`${tableName}\``);
    }
  } finally {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}
