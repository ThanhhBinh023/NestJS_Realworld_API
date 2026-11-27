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
  buildFakeArticle,
  seedArticle,
  seedUser,
  type SeededArticle,
  type SeededUser,
} from './helpers/fake-data.helper.js';

describe('Articles & Tags CRUD (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let authorUser: SeededUser;
  let otherUser: SeededUser;
  let seededArticle: SeededArticle;

  beforeAll(async () => {
    ({ app, dataSource } = await createE2EApp());
  });

  beforeEach(async () => {
    authorUser = await seedUser(app);
    otherUser = await seedUser(app);
    seededArticle = await seedArticle(app, authorUser.token, {
      tagList: ['dragons', 'training', 'fantasy'],
    });
  });

  afterEach(async () => {
    await truncateDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/tags - Get list of tags', async () => {
    const res = await request(app.getHttpServer()).get('/api/tags').expect(200);

    expect(res.body).toHaveProperty('tags');
    expect(res.body.tags).toEqual(
      expect.arrayContaining(['dragons', 'training', 'fantasy']),
    );
  });

  it('POST /api/articles - Create a new article with tags', async () => {
    const newArticle = buildFakeArticle({
      tagList: ['nestjs', 'typeorm'],
    });

    const res = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Token ${authorUser.token}`)
      .send({ article: newArticle })
      .expect(201);

    expect(res.body).toHaveProperty('article');
    expect(res.body.article.title).toBe(newArticle.title);
    expect(res.body.article.description).toBe(newArticle.description);
    expect(res.body.article.tagList).toEqual(
      expect.arrayContaining(['nestjs', 'typeorm']),
    );
    expect(res.body.article.author.username).toBe(authorUser.username);
    expect(res.body.article.slug).toBeDefined();
  });

  it('GET /api/articles/:slug - Retrieve article details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/articles/${seededArticle.slug}`)
      .expect(200);

    expect(res.body.article.slug).toBe(seededArticle.slug);
    expect(res.body.article.author.username).toBe(authorUser.username);
    expect(res.body.article.author.following).toBe(false);
  });

  it('GET /api/articles - List articles with pagination and author info', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/articles?limit=10&offset=0')
      .expect(200);

    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].slug).toBe(seededArticle.slug);
    expect(res.body.articles[0].title).toBe(seededArticle.title);
  });

  it('GET /api/articles - Filter articles by tag', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/articles?tag=dragons')
      .expect(200);

    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].tagList).toContain('dragons');

    const resEmpty = await request(app.getHttpServer())
      .get('/api/articles?tag=nonexistent_tag')
      .expect(200);
    expect(resEmpty.body.articlesCount).toBe(0);
    expect(resEmpty.body.articles).toEqual([]);
  });

  it('GET /api/articles - Filter articles by author', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/articles?author=${authorUser.username}`)
      .expect(200);

    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].slug).toBe(seededArticle.slug);
  });

  it('GET /api/articles/feed - Unauthorized without auth token (401)', async () => {
    await request(app.getHttpServer()).get('/api/articles/feed').expect(401);
  });

  it('GET /api/articles/feed - Empty feed when following nobody', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/articles/feed')
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(200);

    expect(res.body.articles).toEqual([]);
    expect(res.body.articlesCount).toBe(0);
  });

  it('GET /api/articles/feed - Return articles after following author', async () => {
    await request(app.getHttpServer())
      .post(`/api/profiles/${authorUser.username}/follow`)
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/api/articles/feed')
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(200);

    expect(res.body.articlesCount).toBe(1);
    expect(res.body.articles[0].slug).toBe(seededArticle.slug);
    expect(res.body.articles[0].author.following).toBe(true);
  });

  it('POST & DELETE /api/articles/:slug/favorite - Favorite idempotency, filter, and unfavorite', async () => {
    await request(app.getHttpServer())
      .post(`/api/articles/${seededArticle.slug}/favorite`)
      .expect(401);

    const favRes = await request(app.getHttpServer())
      .post(`/api/articles/${seededArticle.slug}/favorite`)
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(200);
    expect(favRes.body.article.favorited).toBe(true);
    expect(favRes.body.article.favoritesCount).toBe(1);

    // Favoriting again is idempotent
    const favAgainRes = await request(app.getHttpServer())
      .post(`/api/articles/${seededArticle.slug}/favorite`)
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(200);
    expect(favAgainRes.body.article.favoritesCount).toBe(1);

    const filterRes = await request(app.getHttpServer())
      .get(`/api/articles?favorited=${otherUser.username}`)
      .expect(200);
    expect(filterRes.body.articlesCount).toBe(1);

    const unfavRes = await request(app.getHttpServer())
      .delete(`/api/articles/${seededArticle.slug}/favorite`)
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(200);
    expect(unfavRes.body.article.favorited).toBe(false);
    expect(unfavRes.body.article.favoritesCount).toBe(0);
  });

  it('PUT /api/articles/:slug - Non-author fails (403) and author updates article', async () => {
    await request(app.getHttpServer())
      .put(`/api/articles/${seededArticle.slug}`)
      .set('Authorization', `Token ${otherUser.token}`)
      .send({ article: { title: 'Hacked title' } })
      .expect(403);

    const updatedDesc = 'An updated description for dragon trainers';
    const res = await request(app.getHttpServer())
      .put(`/api/articles/${seededArticle.slug}`)
      .set('Authorization', `Token ${authorUser.token}`)
      .send({ article: { description: updatedDesc } })
      .expect(200);
    expect(res.body.article.description).toBe(updatedDesc);
  });

  it('DELETE /api/articles/:slug - Non-author fails (403) and author deletes article (404 afterwards)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/articles/${seededArticle.slug}`)
      .set('Authorization', `Token ${otherUser.token}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/api/articles/${seededArticle.slug}`)
      .set('Authorization', `Token ${authorUser.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/articles/${seededArticle.slug}`)
      .expect(404);
  });
});
