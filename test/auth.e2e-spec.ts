import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;
  let authToken = '';
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
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

  it('POST /api/users - Register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: testUser,
      })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).toHaveProperty('username', testUser.username);
    expect(res.body.user).toHaveProperty('token');
    expect(typeof res.body.user.token).toBe('string');
  });

  it('POST /api/users/login - Authenticate with valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: testUser.email,
          password: testUser.password,
        },
      })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.token).toBeDefined();

    authToken = res.body.user.token;
  });

  it('POST /api/users/login - Fail with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/users/login')
      .send({
        user: {
          email: testUser.email,
          password: 'wrong_password',
        },
      })
      .expect(422);
  });

  it('GET /api/user - Get current user using Token authorization header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Token ${authToken}`)
      .expect(200);

    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.username).toBe(testUser.username);
  });

  it('GET /api/user - Get current user using Bearer authorization header', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/user')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.user.email).toBe(testUser.email);
  });

  it('GET /api/user - Reject unauthorized request without token', async () => {
    await request(app.getHttpServer()).get('/api/user').expect(401);
  });

  afterAll(async () => {
    await app.close();
  });
});
