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
import {
  buildFakeUser,
  seedUser,
  type FakeUserInput,
} from './helpers/fake-data.helper.js';

describe('Auth & Users (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let fakeUser: FakeUserInput;

  beforeAll(async () => {
    ({ app, dataSource } = await createE2EApp());
  });

  beforeEach(() => {
    fakeUser = buildFakeUser();
  });

  afterEach(async () => {
    await truncateDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/users - Register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: fakeUser })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', fakeUser.email);
    expect(res.body.user).toHaveProperty('username', fakeUser.username);
    expect(typeof res.body.user.token).toBe('string');
  });

  it('POST /api/users/login - Authenticate with valid credentials', async () => {
    await seedUser(app, fakeUser);

    const res = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: fakeUser.email,
          password: fakeUser.password,
        },
      })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(fakeUser.email);
    expect(res.body.user.token).toBeDefined();
  });

  it('POST /api/users/login - Fail with wrong password (422)', async () => {
    await seedUser(app, fakeUser);

    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: fakeUser.email,
          password: 'wrong_password',
        },
      })
      .expect(422);
  });

  it('GET /api/user - Get current user using Token and Bearer headers', async () => {
    const seeded = await seedUser(app, fakeUser);

    const tokenRes = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Token ${seeded.token}`)
      .expect(200);
    expect(tokenRes.body.user.email).toBe(fakeUser.email);

    const bearerRes = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Bearer ${seeded.token}`)
      .expect(200);
    expect(bearerRes.body.user.username).toBe(fakeUser.username);
  });

  it('GET /api/user - Reject unauthorized request without token (401)', async () => {
    await request(app.getHttpServer()).get('/api/user').expect(401);
  });

  it('POST /api/users/logout - Blacklist token and reject subsequent requests (401)', async () => {
    const seeded = await seedUser(app, fakeUser);

    const logoutRes = await request(app.getHttpServer())
      .post('/api/users/logout')
      .set('Authorization', `Token ${seeded.token}`)
      .expect(200);
    expect(logoutRes.body).toEqual({ message: 'Logged out successfully' });

    await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Token ${seeded.token}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/users/logout')
      .set('Authorization', `Token ${seeded.token}`)
      .expect(401);
  });
});
