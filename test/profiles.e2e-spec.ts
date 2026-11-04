import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('User Update & Profiles (e2e)', () => {
  let app: INestApplication<App>;
  let tokenA = '';
  const now = Date.now();
  const userA = {
    username: `usera_${now}`,
    email: `usera_${now}@test.com`,
    password: 'password123',
  };
  const userB = {
    username: `userb_${now}`,
    email: `userb_${now}@test.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    // Register User A
    const resA = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: userA });
    tokenA = resA.body.user.token;

    // Register User B
    await request(app.getHttpServer()).post('/api/users').send({ user: userB });
  });

  it('PUT /api/user - Update current user bio and image', async () => {
    const updatedBio = 'I like writing clean NestJS code';
    const updatedImage = 'https://api.realworld.io/images/demo.png';

    const res = await request(app.getHttpServer())
      .put('/api/user')
      .set('Authorization', `Token ${tokenA}`)
      .send({
        user: {
          bio: updatedBio,
          image: updatedImage,
        },
      })
      .expect(200);

    expect(res.body.user.bio).toBe(updatedBio);
    expect(res.body.user.image).toBe(updatedImage);
    expect(res.body.user.email).toBe(userA.email);
  });

  it('GET /api/profiles/:username - Get profile anonymously (following: false)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/profiles/${userB.username}`)
      .expect(200);

    expect(res.body.profile.username).toBe(userB.username);
    expect(res.body.profile.following).toBe(false);
  });

  it('POST /api/profiles/:username/follow - User A follows User B', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${tokenA}`)
      .expect(200);

    expect(res.body.profile.username).toBe(userB.username);
    expect(res.body.profile.following).toBe(true);
  });

  it('GET /api/profiles/:username - User A checks profile of User B (following: true)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/profiles/${userB.username}`)
      .set('Authorization', `Token ${tokenA}`)
      .expect(200);

    expect(res.body.profile.following).toBe(true);
  });

  it('DELETE /api/profiles/:username/follow - User A unfollows User B', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${tokenA}`)
      .expect(200);

    expect(res.body.profile.following).toBe(false);
  });

  it('POST /api/profiles/:username/follow - Attempt to follow oneself fails (400)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/profiles/${userA.username}/follow`)
      .set('Authorization', `Token ${tokenA}`)
      .expect(400);

    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('user');
  });

  afterAll(async () => {
    await app.close();
  });
});
