import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Articles & Tags CRUD (e2e)', () => {
  let app: INestApplication<App>;
  let authorToken = '';
  let otherToken = '';
  let createdSlug = '';

  const now = Date.now();
  const authorUser = {
    username: `author_${now}`,
    email: `author_${now}@test.com`,
    password: 'password123',
  };
  const otherUser = {
    username: `other_${now}`,
    email: `other_${now}@test.com`,
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

    // Register Author
    const resA = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: authorUser });
    authorToken = resA.body.user.token;

    // Register Other User
    const resB = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: otherUser });
    otherToken = resB.body.user.token;
  });

  it('GET /api/tags - Get list of tags', async () => {
    const res = await request(app.getHttpServer()).get('/api/tags').expect(200);

    expect(res.body).toHaveProperty('tags');
    expect(Array.isArray(res.body.tags)).toBe(true);
  });

  it('POST /api/articles - Create a new article with tags', async () => {
    const newArticle = {
      title: `How to Train Dragons ${now}`,
      description: 'A comprehensive guide to dragons',
      body: 'Detailed guide with steps',
      tagList: ['dragons', 'training', 'fantasy'],
    };

    const res = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Token ${authorToken}`)
      .send({ article: newArticle })
      .expect(201);

    expect(res.body).toHaveProperty('article');
    expect(res.body.article.title).toBe(newArticle.title);
    expect(res.body.article.description).toBe(newArticle.description);
    expect(res.body.article.tagList).toEqual(
      expect.arrayContaining(['dragons', 'training', 'fantasy']),
    );
    expect(res.body.article.author.username).toBe(authorUser.username);
    expect(res.body.article.slug).toBeDefined();

    createdSlug = res.body.article.slug;
  });

  it('GET /api/tags - Check that newly added tags exist', async () => {
    const res = await request(app.getHttpServer()).get('/api/tags').expect(200);

    expect(res.body.tags).toContain('dragons');
    expect(res.body.tags).toContain('training');
  });

  it('GET /api/articles/:slug - Retrieve article details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/articles/${createdSlug}`)
      .expect(200);

    expect(res.body.article.slug).toBe(createdSlug);
    expect(res.body.article.author.username).toBe(authorUser.username);
    expect(res.body.article.author.following).toBe(false);
  });

  it('PUT /api/articles/:slug - Non-author fails to update (403)', async () => {
    await request(app.getHttpServer())
      .put(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${otherToken}`)
      .send({
        article: {
          title: 'Hacked title',
        },
      })
      .expect(403);
  });

  it('PUT /api/articles/:slug - Author successfully updates article', async () => {
    const updatedDesc = 'An updated description for dragon trainers';

    const res = await request(app.getHttpServer())
      .put(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${authorToken}`)
      .send({
        article: {
          description: updatedDesc,
        },
      })
      .expect(200);

    expect(res.body.article.description).toBe(updatedDesc);
  });

  it('DELETE /api/articles/:slug - Non-author fails to delete (403)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${otherToken}`)
      .expect(403);
  });

  it('DELETE /api/articles/:slug - Author successfully deletes article', async () => {
    await request(app.getHttpServer())
      .delete(`/api/articles/${createdSlug}`)
      .set('Authorization', `Token ${authorToken}`)
      .expect(200);
  });

  it('GET /api/articles/:slug - Article is not found after deletion (404)', async () => {
    await request(app.getHttpServer())
      .get(`/api/articles/${createdSlug}`)
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
