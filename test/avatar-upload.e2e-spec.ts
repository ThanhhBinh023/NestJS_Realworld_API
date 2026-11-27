import * as fs from 'node:fs';
import * as path from 'node:path';
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
import { Attachment } from '../src/modules/attachments/entities/attachment.entity.js';
import { createE2EApp, truncateDatabase } from './helpers/e2e-db.helper.js';
import { seedUser, type SeededUser } from './helpers/fake-data.helper.js';

const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const JPEG_BUFFER = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);

describe('User Avatar Upload & Attachments (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let seededUser: SeededUser;
  const createdFiles: string[] = [];

  beforeAll(async () => {
    ({ app, dataSource } = await createE2EApp());
  });

  beforeEach(async () => {
    seededUser = await seedUser(app);
  });

  afterEach(async () => {
    while (createdFiles.length > 0) {
      const fileUrl = createdFiles.pop();
      if (fileUrl) {
        const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await truncateDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/user/avatar - Unauthorized without token (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/user/avatar')
      .attach('file', PNG_BUFFER, 'avatar.png')
      .expect(401);
  });

  it('POST /api/user/avatar - 400 Bad Request when no file is sent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${seededUser.token}`)
      .expect(400);

    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('file');
  });

  it('POST /api/user/avatar - 400 Bad Request when file is not an allowed image type', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${seededUser.token}`)
      .attach('file', Buffer.from('plain text data'), 'document.txt')
      .expect(400);

    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/user/avatar - Saves attachment record with UUID, updates user.image, and serves static file', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${seededUser.token}`)
      .attach('file', PNG_BUFFER, {
        filename: 'avatar.png',
        contentType: 'image/png',
      })
      .expect(200);

    const avatarUrl: string = res.body.user.image;
    createdFiles.push(avatarUrl);

    expect(avatarUrl).toMatch(/^\/uploads\/avatars\/avatar-.*\.png$/);

    const attachmentRepo = dataSource.getRepository(Attachment);
    const attachments = await attachmentRepo.find();
    expect(attachments).toHaveLength(1);
    expect(attachments[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(attachments[0].attachableType).toBe('user');
    expect(attachments[0].url).toBe(avatarUrl);
    expect(attachments[0].fileType).toBe('image/png');
    expect(attachments[0].fileSize).toBe(PNG_BUFFER.length);

    const staticRes = await request(app.getHttpServer())
      .get(avatarUrl)
      .expect(200);
    expect(staticRes.header['content-type']).toContain('image/png');
  });

  it('POST /api/user/avatar - Replaces previous attachment and cleans up old disk file when field "avatar" is used', async () => {
    const firstRes = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${seededUser.token}`)
      .attach('file', PNG_BUFFER, {
        filename: 'first.png',
        contentType: 'image/png',
      })
      .expect(200);

    const firstUrl: string = firstRes.body.user.image;
    const firstPath = path.join(process.cwd(), firstUrl.replace(/^\//, ''));
    expect(fs.existsSync(firstPath)).toBe(true);

    const secondRes = await request(app.getHttpServer())
      .post('/api/user/avatar')
      .set('Authorization', `Token ${seededUser.token}`)
      .attach('avatar', JPEG_BUFFER, {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    const secondUrl: string = secondRes.body.user.image;
    createdFiles.push(secondUrl);

    expect(secondUrl).toMatch(/^\/uploads\/avatars\/avatar-.*\.jpg$/);
    expect(fs.existsSync(firstPath)).toBe(false);

    const attachmentRepo = dataSource.getRepository(Attachment);
    const attachments = await attachmentRepo.find();
    expect(attachments).toHaveLength(1);
    expect(attachments[0].url).toBe(secondUrl);
  });
});
