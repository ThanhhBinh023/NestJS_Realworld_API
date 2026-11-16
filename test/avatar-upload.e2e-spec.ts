import * as path from 'node:path';
import * as fs from 'node:fs';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('User Avatar Upload (e2e)', () => {
  let app: NestExpressApplication;
  let userToken = '';
  let uploadedAvatarUrl = '';

  const now = Date.now();
  const testUser = {
    username: `avatar_user_${now}`,
    email: `avatar_user_${now}@test.com`,
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

    // Register test user
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: testUser });
    userToken = res.body.user.token;
  });

  it('POST /api/user/avatar - Unauthorized without token (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/user/avatar')
      .attach('file', Buffer.from('fake-image-data'), 'avatar.png')
      .expect(401);
  });

  it('POST /api/user/avatar - 400 Bad Request when no file is sent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${userToken}`)
      .expect(400);

    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('file');
  });

  it('POST /api/user/avatar - 400 Bad Request when file is not an allowed image type', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${userToken}`)
      .attach('file', Buffer.from('plain text data'), 'document.txt')
      .expect(400);

    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/user/avatar - Successfully upload avatar image (.png)', async () => {
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );

    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${userToken}`)
      .attach('file', pngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.image).toBeDefined();
    expect(res.body.user.image).toMatch(/^\/uploads\/avatars\/avatar-.*\.png$/);

    uploadedAvatarUrl = res.body.user.image;
  });

  it('GET /api/user - Verify user.image is updated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Token ${userToken}`)
      .expect(200);

    expect(res.body.user.image).toBe(uploadedAvatarUrl);
  });

  it('GET /uploads/avatars/:filename - Verify static file is accessible', async () => {
    const res = await request(app.getHttpServer())
      .get(uploadedAvatarUrl)
      .expect(200);

    expect(res.header['content-type']).toContain('image/png');
  });

  it('POST /api/user/avatar - Successfully upload avatar using field name "avatar"', async () => {
    const jpegBuffer = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      'base64',
    );

    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${userToken}`)
      .attach('avatar', jpegBuffer, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    expect(res.body.user.image).toMatch(/^\/uploads\/avatars\/avatar-.*\.jpg$/);
  });

  afterAll(async () => {
    await app.close();
  });
});
