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
  buildFakeComment,
  seedArticle,
  seedComment,
  seedUser,
  type SeededArticle,
  type SeededUser,
} from './helpers/fake-data.helper.js';

/**
 * C2-level (Condition / Branch Coverage) E2E test suite for CommentsController:
 * - POST /api/articles/:slug/comments (create)
 * - GET  /api/articles/:slug/comments (findAll)
 * - DELETE /api/articles/:slug/comments/:id (delete)
 *
 * Every test case seeds isolated fake data in beforeEach and truncates all tables in afterEach.
 */
describe('CommentsController C2 Coverage (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;

  let articleAuthor: SeededUser;
  let commenter: SeededUser;
  let thirdUser: SeededUser;
  let primaryArticle: SeededArticle;
  let secondaryArticle: SeededArticle;

  beforeAll(async () => {
    ({ app, dataSource } = await createE2EApp());
  });

  beforeEach(async () => {
    articleAuthor = await seedUser(app);
    commenter = await seedUser(app);
    thirdUser = await seedUser(app);
    primaryArticle = await seedArticle(app, articleAuthor.token);
    secondaryArticle = await seedArticle(app, articleAuthor.token);
  });

  afterEach(async () => {
    await truncateDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/articles/:slug/comments (create - C2 branches)', () => {
    it('Branch 1: returns 401 when Authorization header is missing', async () => {
      const fakeComment = buildFakeComment();

      await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .send({ comment: fakeComment })
        .expect(401);
    });

    it('Branch 2: returns 401 when JWT token is malformed', async () => {
      const fakeComment = buildFakeComment();

      await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', 'Token invalid.jwt.token')
        .send({ comment: fakeComment })
        .expect(401);
    });

    it('Branch 3: returns 401 when JWT token was revoked via logout (blacklisted)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${commenter.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: buildFakeComment() })
        .expect(401);
    });

    it('Branch 4: returns 400 when comment wrapper object is missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('errors');
    });

    it('Branch 5: returns 400 when comment.body is empty string', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: { body: '' } })
        .expect(400);

      expect(res.body).toHaveProperty('errors');
    });

    it('Branch 6: returns 400 when extra non-whitelisted properties are sent', async () => {
      await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({
          comment: {
            body: buildFakeComment().body,
            extraField: 'should-be-rejected',
          },
        })
        .expect(400);
    });

    it('Branch 7: returns 404 when target article slug does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/non-existent-article-slug/comments')
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: buildFakeComment() })
        .expect(404);
    });

    it('Branch 8: returns 201, persists comment, and returns author profile when valid', async () => {
      const fakeComment = buildFakeComment();

      const res = await request(app.getHttpServer())
        .post(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${commenter.token}`)
        .send({ comment: fakeComment })
        .expect(201);

      expect(res.body.comment).toMatchObject({
        body: fakeComment.body,
        author: {
          username: commenter.username,
          bio: null,
          image: null,
          following: false,
        },
      });
      expect(typeof res.body.comment.id).toBe('number');
    });
  });

  describe('GET /api/articles/:slug/comments (findAll - C2 branches)', () => {
    it('Branch 9: returns 404 when article slug does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/non-existent-article-slug/comments')
        .expect(404);
    });

    it('Branch 10: returns 200 with empty array when article has no comments', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(200);

      expect(res.body).toEqual({ comments: [] });
    });

    it('Branch 11: returns comments with following: false when visitor is anonymous', async () => {
      const created = await seedComment(
        app,
        primaryArticle.slug,
        commenter.token,
      );

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .expect(200);

      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].id).toBe(created.id);
      expect(res.body.comments[0].body).toBe(created.body);
      expect(res.body.comments[0].author.following).toBe(false);
    });

    it('Branch 12: treats blacklisted token as anonymous in OptionalJwtAuthGuard (following: false)', async () => {
      await seedComment(app, primaryArticle.slug, commenter.token);

      await request(app.getHttpServer())
        .post(`/api/profiles/${commenter.username}/follow`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(200);

      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].author.following).toBe(false);
    });

    it('Branch 13: returns following: false for authenticated user not following comment author', async () => {
      await seedComment(app, primaryArticle.slug, commenter.token);

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${thirdUser.token}`)
        .expect(200);

      expect(res.body.comments).toHaveLength(1);
      expect(res.body.comments[0].author.following).toBe(false);
    });

    it('Branch 14: maps following: true only for followed authors across multiple comments', async () => {
      await seedComment(app, primaryArticle.slug, commenter.token);
      await seedComment(app, primaryArticle.slug, thirdUser.token);

      await request(app.getHttpServer())
        .post(`/api/profiles/${commenter.username}/follow`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(200);

      expect(res.body.comments).toHaveLength(2);
      const byAuthor = new Map<string, boolean>(
        res.body.comments.map((c: any) => [
          c.author.username,
          c.author.following,
        ]),
      );
      expect(byAuthor.get(commenter.username)).toBe(true);
      expect(byAuthor.get(thirdUser.username)).toBe(false);
    });
  });

  describe('DELETE /api/articles/:slug/comments/:id (delete - C2 branches)', () => {
    it('Branch 15: returns 401 when unauthenticated or token blacklisted', async () => {
      const comment = await seedComment(
        app,
        primaryArticle.slug,
        commenter.token,
      );

      await request(app.getHttpServer())
        .delete(`/api/articles/${primaryArticle.slug}/comments/${comment.id}`)
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', `Token ${commenter.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/articles/${primaryArticle.slug}/comments/${comment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(401);
    });

    it('Branch 16: returns 400 when comment id param is not a valid integer (ParseIntPipe)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${primaryArticle.slug}/comments/not-a-number`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(400);
    });

    it('Branch 17: returns 404 when article slug does not exist', async () => {
      const comment = await seedComment(
        app,
        primaryArticle.slug,
        commenter.token,
      );

      await request(app.getHttpServer())
        .delete(`/api/articles/non-existent-slug/comments/${comment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(404);
    });

    it('Branch 18: returns 404 when comment id does not exist on article', async () => {
      await request(app.getHttpServer())
        .delete(`/api/articles/${primaryArticle.slug}/comments/999999`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(404);
    });

    it('Branch 19: returns 404 when deleting comment via another article slug', async () => {
      const comment = await seedComment(
        app,
        primaryArticle.slug,
        commenter.token,
      );

      await request(app.getHttpServer())
        .delete(`/api/articles/${secondaryArticle.slug}/comments/${comment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(404);

      // Confirm comment still exists on primaryArticle
      const checkRes = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .expect(200);
      expect(checkRes.body.comments).toHaveLength(1);
    });

    it('Branch 20: returns 403 when caller is not the author of the comment', async () => {
      const comment = await seedComment(
        app,
        primaryArticle.slug,
        commenter.token,
      );

      // Even the article author cannot delete someone else's comment
      await request(app.getHttpServer())
        .delete(`/api/articles/${primaryArticle.slug}/comments/${comment.id}`)
        .set('Authorization', `Token ${articleAuthor.token}`)
        .expect(403);

      const checkRes = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .expect(200);
      expect(checkRes.body.comments).toHaveLength(1);
    });

    it('Branch 21: returns 200 and deletes comment from DB when caller is author', async () => {
      const comment = await seedComment(
        app,
        primaryArticle.slug,
        commenter.token,
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/articles/${primaryArticle.slug}/comments/${comment.id}`)
        .set('Authorization', `Token ${commenter.token}`)
        .expect(200);

      expect(res.body).toEqual({ message: 'Comment deleted successfully' });

      const checkRes = await request(app.getHttpServer())
        .get(`/api/articles/${primaryArticle.slug}/comments`)
        .expect(200);
      expect(checkRes.body.comments).toHaveLength(0);
    });
  });
});
