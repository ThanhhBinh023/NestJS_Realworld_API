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
import { seedUser, type SeededUser } from './helpers/fake-data.helper.js';

describe('User Update & Profiles (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let userA: SeededUser;
  let userB: SeededUser;

  beforeAll(async () => {
    ({ app, dataSource } = await createE2EApp());
  });

  beforeEach(async () => {
    userA = await seedUser(app);
    userB = await seedUser(app);
  });

  afterEach(async () => {
    await truncateDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('PUT /api/user - Update current user bio and image', async () => {
    const updatedBio = 'I like writing clean NestJS code';
    const updatedImage = 'https://api.realworld.io/images/demo.png';

    const res = await request(app.getHttpServer())
      .put('/api/user')
      .set('Authorization', `Token ${userA.token}`)
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

  it('POST & DELETE /api/profiles/:username/follow - Follow and unfollow user', async () => {
    const followRes = await request(app.getHttpServer())
      .post(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${userA.token}`)
      .expect(200);
    expect(followRes.body.profile.following).toBe(true);

    const profileRes = await request(app.getHttpServer())
      .get(`/api/profiles/${userB.username}`)
      .set('Authorization', `Token ${userA.token}`)
      .expect(200);
    expect(profileRes.body.profile.following).toBe(true);

    const unfollowRes = await request(app.getHttpServer())
      .delete(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${userA.token}`)
      .expect(200);
    expect(unfollowRes.body.profile.following).toBe(false);
  });

  it('POST /api/profiles/:username/follow - Attempt to follow oneself fails (400)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/profiles/${userA.username}/follow`)
      .set('Authorization', `Token ${userA.token}`)
      .expect(400);

    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveProperty('user');
  });
});
