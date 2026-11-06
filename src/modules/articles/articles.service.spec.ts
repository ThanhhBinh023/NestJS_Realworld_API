import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service.js';
import { User } from '../users/entities/user.entity.js';

describe('ArticlesService', () => {
  let articlesService: ArticlesService;
  let mockArticleRepository: any;
  let mockFollowRepository: any;
  let mockTagsService: any;

  const mockAuthor = {
    id: 1,
    username: 'binh',
    bio: 'Software engineer',
    image: 'avatar.png',
  } as User;

  beforeEach(() => {
    mockArticleRepository = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation((article) => ({
        ...article,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      remove: vi.fn(),
    };

    mockFollowRepository = {
      findOne: vi.fn(),
    };

    mockTagsService = {
      findOrCreateTags: vi
        .fn()
        .mockImplementation((tags: string[]) =>
          tags.map((name, id) => ({ id, name })),
        ),
    };

    articlesService = new ArticlesService(
      mockArticleRepository,
      mockFollowRepository,
      mockTagsService,
    );
  });

  describe('create', () => {
    it('should create an article with unique slug and mapped tags', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(null);

      const dto = {
        article: {
          title: 'NestJS Clean Architecture',
          description: 'A comprehensive guide',
          body: 'Here is how you structure a NestJS app',
          tagList: ['nestjs', 'architecture'],
        },
      };

      const result = await articlesService.create(mockAuthor, dto);

      expect(result.article.title).toBe(dto.article.title);
      expect(result.article.slug).toBe('nestjs-clean-architecture');
      expect(result.article.tagList).toEqual(['nestjs', 'architecture']);
      expect(result.article.author.username).toBe('binh');
      expect(result.article.favoritesCount).toBe(0);
      expect(result.article.favorited).toBe(false);
    });
  });

  describe('findBySlug', () => {
    it('should throw NotFoundException if article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(null);

      await expect(articlesService.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return article and determine isFollowing correctly', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce({
        id: 1,
        slug: 'existing-article',
        title: 'Existing Article',
        description: 'Desc',
        body: 'Body content',
        favoritesCount: 0,
        author: mockAuthor,
        tags: [{ name: 'tag1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockFollowRepository.findOne.mockResolvedValueOnce({ id: 1 });

      const result = await articlesService.findBySlug('existing-article', 2);

      expect(result.article.slug).toBe('existing-article');
      expect(result.article.author.following).toBe(true);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user is not author', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce({
        id: 1,
        author: { id: 99 },
      });

      await expect(
        articlesService.update('test-slug', 1, {
          article: { title: 'New' },
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update article and regenerate slug when title changed', async () => {
      const existingArticle = {
        id: 1,
        slug: 'old-slug',
        title: 'Old Title',
        description: 'Old Desc',
        body: 'Old Body',
        author: mockAuthor,
        tags: [],
        favoritesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockArticleRepository.findOne
        .mockResolvedValueOnce(existingArticle)
        .mockResolvedValueOnce(null);

      const result = await articlesService.update('old-slug', 1, {
        article: { title: 'Brand New Title' },
      });

      expect(result.article.title).toBe('Brand New Title');
      expect(result.article.slug).toBe('brand-new-title');
    });
  });

  describe('delete', () => {
    it('should throw ForbiddenException if user is not author', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce({
        id: 1,
        author: { id: 99 },
      });

      await expect(articlesService.delete('test-slug', 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should remove article when user is author', async () => {
      const existingArticle = {
        id: 1,
        author: mockAuthor,
      };
      mockArticleRepository.findOne.mockResolvedValueOnce(existingArticle);

      await articlesService.delete('test-slug', 1);

      expect(mockArticleRepository.remove).toHaveBeenCalledWith(
        existingArticle,
      );
    });
  });
});
