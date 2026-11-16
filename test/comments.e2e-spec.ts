import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';

describe('Comments API (e2e)', () => {
  let app: INestApplication<App>;
  let userAToken = '';
  let userBToken = '';
  let articleSlug = '';
  let commentId = 0;

  const now = Date.now();
  const userA = {
    username: `comment_author_${now}`,
    email: `comment_author_${now}@test.com`,
    password: 'password123',
  };
  const userB = {
    username: `commenter_${now}`,
    email: `commenter_${now}@test.com`,
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
    userAToken = resA.body.user.token;

    // Register User B
    const resB = await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: userB });
    userBToken = resB.body.user.token;

    // User A creates an article
    const resArticle = await request(app.getHttpServer())
      .post('/api/articles')
      .set('Authorization', `Token ${userAToken}`)
      .send({
        article: {
          title: `Commentable Article ${now}`,
          description: 'Article for comments testing',
          body: 'Content for comment testing',
          tagList: ['comments'],
        },
      });
    articleSlug = resArticle.body.article.slug;
  });

  it('POST /api/articles/:slug/comments - Unauthorized without token (401)', async () => {
    await request(app.getHttpServer())
      .post(`/api/articles/${articleSlug}/comments`)
      .send({ comment: { body: 'Unauthorized comment' } })
      .expect(401);
  });

  it('POST /api/articles/:slug/comments - 404 if article not found', async () => {
    await request(app.getHttpServer())
      .post('/api/articles/non-existing-slug-12345/comments')
      .set('Authorization', `Token ${userBToken}`)
      .send({ comment: { body: 'Comment on nothing' } })
      .expect(404);
  });

  it('POST /api/articles/:slug/comments - 400 if body is invalid', async () => {
    await request(app.getHttpServer())
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${userBToken}`)
      .send({ comment: { body: '' } })
      .expect(400);
  });

  it('POST /api/articles/:slug/comments - Successfully add a comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${userBToken}`)
      .send({ comment: { body: 'This is an awesome post!' } })
      .expect(201);

    expect(res.body).toHaveProperty('comment');
    expect(res.body.comment.body).toBe('This is an awesome post!');
    expect(res.body.comment.author.username).toBe(userB.username);
    expect(res.body.comment.author.following).toBe(false);
    expect(res.body.comment.id).toBeDefined();

    commentId = res.body.comment.id;
  });

  it('GET /api/articles/:slug/comments - 404 if article not found', async () => {
    await request(app.getHttpServer())
      .get('/api/articles/non-existing-slug-12345/comments')
      .expect(404);
  });

  it('GET /api/articles/:slug/comments - List comments anonymously', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/articles/${articleSlug}/comments`)
      .expect(200);

    expect(res.body).toHaveProperty('comments');
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments.length).toBe(1);
    expect(res.body.comments[0].id).toBe(commentId);
    expect(res.body.comments[0].body).toBe('This is an awesome post!');
    expect(res.body.comments[0].author.following).toBe(false);
  });

  it('GET /api/articles/:slug/comments - List comments with authenticated user following author', async () => {
    // User A follows User B
    await request(app.getHttpServer())
      .post(`/api/profiles/${userB.username}/follow`)
      .set('Authorization', `Token ${userAToken}`)
      .expect(200);

    // User A views comments on the article
    const res = await request(app.getHttpServer())
      .get(`/api/articles/${articleSlug}/comments`)
      .set('Authorization', `Token ${userAToken}`)
      .expect(200);

    expect(res.body.comments[0].author.following).toBe(true);
  });

  it('DELETE /api/articles/:slug/comments/:id - Unauthorized without token (401)', async () => {
    await request(app.getHttpServer())
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .expect(401);
  });

  it('DELETE /api/articles/:slug/comments/:id - Forbidden if non-author deletes (403)', async () => {
    // User A tries to delete User B's comment
    await request(app.getHttpServer())
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${userAToken}`)
      .expect(403);
  });

  it('DELETE /api/articles/:slug/comments/:id - Successfully delete comment by author', async () => {
    await request(app.getHttpServer())
      .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
      .set('Authorization', `Token ${userBToken}`)
      .expect(200);
  });

  it('GET /api/articles/:slug/comments - Verify comment is removed', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/articles/${articleSlug}/comments`)
      .expect(200);

    expect(res.body.comments.length).toBe(0);
  });

  afterAll(async () => {
    await app.close();
  });
});
