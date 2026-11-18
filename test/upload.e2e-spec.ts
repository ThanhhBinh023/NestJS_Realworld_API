import * as path from 'node:path';
import * as fs from 'node:fs';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Generic Image Upload API (e2e)', () => {
  let app: NestExpressApplication;
  let userToken = '';
  let uploadedImageUrl = '';

  const now = Date.now();
  const testUser = {
    username: `uploader_${now}`,
    email: `uploader_${now}@test.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
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
        transform: true,
      }),
    );
    await app.init();

    // Register user
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: testUser });
    userToken = res.body.user.token;
  });

  it('POST /api/upload/image - Unauthorized without token (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/upload/image')
      .attach('file', Buffer.from('fake-data'), 'test.png')
      .expect(401);
  });

  it('POST /api/upload/image - 400 Bad Request when no file sent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/upload/image')
      .set('Authorization', `Token ${userToken}`)
      .expect(400);

    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('file');
  });

  it('POST /api/upload/image - 400 Bad Request when file is not an allowed image type', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/upload/image')
      .set('Authorization', `Token ${userToken}`)
      .attach('file', Buffer.from('console.log("hello")'), 'script.js')
      .expect(400);

    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/upload/image - Successfully upload image (.png)', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );

    const res = await request(app.getHttpServer())
      .post('/api/upload/image')
      .set('Authorization', `Token ${userToken}`)
      .attach('file', pngBuffer, {
        filename: 'article-media.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(res.body).toHaveProperty('image');
    expect(res.body.image.url).toMatch(/^\/uploads\/images\/image-.*\.png$/);
    expect(res.body.image.mimetype).toBe('image/png');
    expect(res.body.image.filename).toBeDefined();
    expect(res.body.image.size).toBeGreaterThan(0);

    uploadedImageUrl = res.body.image.url;
  });

  it('GET /uploads/images/:filename - Static asset is served successfully', async () => {
    const res = await request(app.getHttpServer())
      .get(uploadedImageUrl)
      .expect(200);

    expect(res.header['content-type']).toContain('image/png');
  });

  afterAll(async () => {
    await app.close();
  });
});
