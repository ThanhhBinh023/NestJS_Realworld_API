import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { createE2EApp, truncateDatabase } from './helpers/e2e-db.helper.js';

describe('HelloController (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await createE2EApp());
  });

  beforeEach(() => {
    // No DB seed needed for stateless HelloController
  });

  afterEach(async () => {
    await truncateDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/hello (GET) - returns English by default', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/hello')
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Hello World!');
    expect(res.body).toHaveProperty('lang', 'en');
  });

  it('/api/hello?lang=vi (GET) - returns Vietnamese when requested', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/hello?lang=vi')
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Xin chào thế giới!');
    expect(res.body).toHaveProperty('lang', 'vi');
  });
});
