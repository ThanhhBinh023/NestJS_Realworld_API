# RealWorld Conduit Backend API (NestJS)

A production-ready implementation of the [RealWorld Conduit Spec](https://realworld-docs.netlify.app/) built with **NestJS**, **TypeORM**, and **MySQL**.

## Tech Stack & Architecture

- **Framework**: [NestJS](https://nestjs.com/) (Modular Architecture)
- **Language**: TypeScript (strict mode, Google TypeScript Style Guide compliant)
- **Documentation**: Swagger OpenAPI (`@nestjs/swagger`) at `/api/docs`
- **Internationalization (i18n)**: `nestjs-i18n` with support for English (`en`) and Vietnamese (`vi`)
- **Validation & Transformation**: `class-validator`, `class-transformer`
- **Testing**: `vitest`, `supertest` (Unit tests & E2E tests)
- **Code Quality**: `oxlint`, `prettier`

---

## Roadmap / Pull Requests Tracking

- [x] **PR 01 - `feature/init-project-i18n-swagger`**:
  - NestJS project scaffolding & modular structure
  - Swagger OpenAPI integration (`/api/docs`)
  - Internationalization (`nestjs-i18n`) with `en` and `vi`
  - Hello World API (`GET /api/hello`) with query params & i18n
  - Global ValidationPipe, CORS, and environment configuration
  - Unit tests & E2E tests
- [ ] **PR 02 - `feature/database-migration-auth`**:
  - TypeORM + MySQL connection
  - Manual migration scripts (generate, run, revert, reset)
  - User Entity & JWT Authentication (Registration & Login)
- [ ] **PR 03 - `feature/user-profile-module`**:
  - Current user endpoints & Profile module (Follow / Unfollow)
- [ ] **PR 04 - `feature/article-crud-base`**:
  - Article & Tag entities, Create/Read/Update/Delete Article
- [ ] **PR 05 - `feature/article-filter-feed-pagination`**:
  - Search/Filter, Pagination, Articles Feed
- [ ] **PR 06 - `feature/comments-and-favorites`**:
  - Article comments & Favorite / Unfavorite
- [ ] **PR 07 - `feature/file-upload-multer`**:
  - File/Avatar upload with Multer (Cloudinary / Local)
- [ ] **PR 08 - `feature/mail-queue-and-schedule`**:
  - Asynchronous mail queue (`@nestjs/bull` + Redis) & Cron tasks (`@nestjs/schedule`)
- [ ] **PR 09 - `feature/unit-and-e2e-tests`**:
  - Complete test coverage for Auth, Articles, and Comments
- [ ] **PR 10 - `feature/final-review-refactor`**:
  - Full Sunlint / Google TS audit and final polish

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Run the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### 4. API Documentation

Once started, visit:
- **API Base URL**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/api/docs`

### 5. Running Tests & Quality Checks

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Code style & Lint check
npm run lint
npm run format
```
