import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AppModule } from './../src/app.module.js';

describe('HelloController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
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

  afterEach(async () => {
    await app.close();
  });
});
