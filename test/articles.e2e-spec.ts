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

  it('GET /api/articles - List articles with pagination and author info', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/articles?limit=10&offset=0')
      .expect(200);

    expect(res.body).toHaveProperty('articles');
    expect(res.body).toHaveProperty('articlesCount');
    expect(Array.isArray(res.body.articles)).toBe(true);
    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);

    const found = res.body.articles.find(
      (a: { slug: string }) => a.slug === createdSlug,
    );
    expect(found).toBeDefined();
    expect(found.title).toBe(`How to Train Dragons ${now}`);
  });

  it('GET /api/articles - Filter articles by tag', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/articles?tag=dragons')
      .expect(200);

    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
    const hasDragon = res.body.articles.some((a: { tagList: string[] }) =>
      a.tagList.includes('dragons'),
    );
    expect(hasDragon).toBe(true);

    const resEmpty = await request(app.getHttpServer())
      .get(`/api/articles?tag=nonexistent_tag_${now}`)
      .expect(200);
    expect(resEmpty.body.articlesCount).toBe(0);
    expect(resEmpty.body.articles).toEqual([]);
  });

  it('GET /api/articles - Filter articles by author', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/articles?author=${authorUser.username}`)
      .expect(200);

    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].slug).toBe(createdSlug);
    expect(res.body.articles[0].author.username).toBe(authorUser.username);
  });

  it('GET /api/articles/feed - Unauthorized without auth token (401)', async () => {
    await request(app.getHttpServer()).get('/api/articles/feed').expect(401);
  });

  it('GET /api/articles/feed - Empty feed when following nobody', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/articles/feed')
      .set('Authorization', `Token ${otherToken}`)
      .expect(200);

    expect(res.body.articles).toEqual([]);
    expect(res.body.articlesCount).toBe(0);
  });

  it('GET /api/articles/feed - Return articles after following author', async () => {
    // otherUser follows authorUser
    await request(app.getHttpServer())
      .post(`/api/profiles/${authorUser.username}/follow`)
      .set('Authorization', `Token ${otherToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/articles/feed')
      .set('Authorization', `Token ${otherToken}`)
      .expect(200);

    expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
    const feedItem = res.body.articles.find(
      (a: { slug: string }) => a.slug === createdSlug,
    );
    expect(feedItem).toBeDefined();
    expect(feedItem.author.following).toBe(true);
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
