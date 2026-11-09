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
      createQueryBuilder: vi.fn(),
    };

    mockFollowRepository = {
      findOne: vi.fn(),
      find: vi.fn(),
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

  describe('findAll', () => {
    it('should return articles and total count with default pagination', async () => {
      const mockArticles = [
        {
          id: 1,
          slug: 'art-1',
          title: 'Art 1',
          description: 'Desc 1',
          body: 'Body 1',
          favoritesCount: 0,
          author: mockAuthor,
          tags: [{ name: 'tech' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const qb: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValueOnce([mockArticles, 1]),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(qb);
      mockFollowRepository.find.mockResolvedValueOnce([]);

      const result = await articlesService.findAll({}, undefined);

      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].slug).toBe('art-1');
      expect(result.articles[0].tagList).toEqual(['tech']);
      expect(qb.take).toHaveBeenCalledWith(20);
      expect(qb.skip).toHaveBeenCalledWith(0);
    });

    it('should apply filters for tag and author when provided', async () => {
      const qb: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValueOnce([[], 0]),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await articlesService.findAll(
        { tag: 'react', author: 'binh', limit: 5, offset: 10 },
        undefined,
      );

      expect(result.articles).toEqual([]);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'article.id IN (SELECT at.articleId FROM articles_tags at JOIN tags t ON t.id = at.tagId WHERE t.name = :tag)',
        { tag: 'react' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('author.username = :author', {
        author: 'binh',
      });
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(qb.skip).toHaveBeenCalledWith(10);
    });

    it('should return empty list when favorited filter is used (until PR 06)', async () => {
      const result = await articlesService.findAll({ favorited: 'binh' });

      expect(result.articles).toEqual([]);
      expect(result.articlesCount).toBe(0);
      expect(mockArticleRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should mark following true if current user follows article author', async () => {
      const mockArticles = [
        {
          id: 1,
          slug: 'art-1',
          title: 'Art 1',
          description: 'Desc 1',
          body: 'Body 1',
          favoritesCount: 0,
          author: mockAuthor,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const qb: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValueOnce([mockArticles, 1]),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(qb);
      mockFollowRepository.find.mockResolvedValueOnce([
        { followerId: 2, followingId: 1 },
      ]);

      const result = await articlesService.findAll({}, 2);

      expect(result.articles[0].author.following).toBe(true);
    });
  });

  describe('findFeed', () => {
    it('should return empty list when user follows no one', async () => {
      mockFollowRepository.find.mockResolvedValueOnce([]);

      const result = await articlesService.findFeed({}, 1);

      expect(result.articles).toEqual([]);
      expect(result.articlesCount).toBe(0);
      expect(mockArticleRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return feed articles of followed users', async () => {
      mockFollowRepository.find.mockResolvedValueOnce([
        { followerId: 2, followingId: 1 },
      ]);

      const mockArticles = [
        {
          id: 1,
          slug: 'followed-article',
          title: 'Followed Article',
          description: 'Desc',
          body: 'Content',
          favoritesCount: 0,
          author: mockAuthor,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const qb: any = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValueOnce([mockArticles, 1]),
      };

      mockArticleRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await articlesService.findFeed(
        { limit: 10, offset: 0 },
        2,
      );

      expect(result.articlesCount).toBe(1);
      expect(result.articles[0].slug).toBe('followed-article');
      expect(result.articles[0].author.following).toBe(true);
      expect(qb.where).toHaveBeenCalledWith(
        'article.authorId IN (:...followingIds)',
        { followingIds: [1] },
      );
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
