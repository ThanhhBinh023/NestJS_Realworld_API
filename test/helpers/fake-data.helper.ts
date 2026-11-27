import { faker } from '@faker-js/faker';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface FakeUserInput {
  username: string;
  email: string;
  password: string;
}

export interface FakeArticleInput {
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface FakeCommentInput {
  body: string;
}

export interface SeededUser {
  username: string;
  email: string;
  password: string;
  token: string;
}

export interface SeededArticle {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
}

export interface SeededComment {
  id: number;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
    following: boolean;
  };
}

export function buildFakeUser(
  overrides: Partial<FakeUserInput> = {},
): FakeUserInput {
  const suffix = faker.string.alphanumeric(6).toLowerCase();
  const baseName = faker.person
    .firstName()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/g, '');

  return {
    username: overrides.username ?? `${baseName || 'binh'}_${suffix}`,
    email:
      overrides.email ??
      `${baseName || 'binh'}.${suffix}@${faker.internet.domainName()}`,
    password: overrides.password ?? faker.internet.password({ length: 12 }),
  };
}

export function buildFakeArticle(
  overrides: Partial<FakeArticleInput> = {},
): FakeArticleInput {
  return {
    title:
      overrides.title ??
      `${faker.lorem.words(4)} ${faker.string.alphanumeric(5)}`,
    description: overrides.description ?? faker.lorem.sentence(),
    body: overrides.body ?? faker.lorem.paragraphs(2),
    tagList: overrides.tagList ?? [
      faker.lorem.word().toLowerCase(),
      faker.lorem.word().toLowerCase(),
    ],
  };
}

export function buildFakeComment(
  overrides: Partial<FakeCommentInput> = {},
): FakeCommentInput {
  return {
    body: overrides.body ?? faker.lorem.sentence(),
  };
}

export async function seedUser(
  app: INestApplication,
  overrides: Partial<FakeUserInput> = {},
): Promise<SeededUser> {
  const payload = buildFakeUser(overrides);
  const res = await request(app.getHttpServer())
    .post('/api/users')
    .send({ user: payload })
    .expect(201);

  return {
    ...payload,
    token: res.body.user.token,
  };
}

export async function seedArticle(
  app: INestApplication,
  token: string,
  overrides: Partial<FakeArticleInput> = {},
): Promise<SeededArticle> {
  const payload = buildFakeArticle(overrides);
  const res = await request(app.getHttpServer())
    .post('/api/articles')
    .set('Authorization', `Token ${token}`)
    .send({ article: payload })
    .expect(201);

  return res.body.article;
}

export async function seedComment(
  app: INestApplication,
  slug: string,
  token: string,
  overrides: Partial<FakeCommentInput> = {},
): Promise<SeededComment> {
  const payload = buildFakeComment(overrides);
  const res = await request(app.getHttpServer())
    .post(`/api/articles/${slug}/comments`)
    .set('Authorization', `Token ${token}`)
    .send({ comment: payload })
    .expect(201);

  return res.body.comment;
}
