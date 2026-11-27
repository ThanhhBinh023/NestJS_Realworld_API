import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { User } from '../users/entities/user.entity.js';
import { Article } from '../articles/entities/article.entity.js';

describe('CommentsService', () => {
  let commentsService: CommentsService;
  let mockCommentRepository: any;
  let mockArticleRepository: any;
  let mockProfilesService: any;

  const mockAuthor = {
    id: 1,
    username: 'binh',
    bio: 'Software engineer',
    image: 'avatar.png',
  } as User;

  const mockArticle = {
    id: 1,
    slug: 'test-article-slug',
    title: 'Test Article',
  } as Article;

  beforeEach(() => {
    mockCommentRepository = {
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation((comment) => ({
        ...comment,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      remove: vi.fn(),
    };

    mockArticleRepository = {
      findOne: vi.fn(),
    };

    mockProfilesService = {
      getFollowedAuthorIds: vi.fn().mockResolvedValue(new Set()),
      buildProfileDto: vi
        .fn()
        .mockImplementation((user: User, following: boolean) => ({
          username: user.username,
          bio: user.bio ?? null,
          image: user.image ?? null,
          following,
        })),
    };

    commentsService = new CommentsService(
      mockCommentRepository,
      mockArticleRepository,
      mockProfilesService,
    );
  });

  describe('create', () => {
    it('should throw NotFoundException if article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        commentsService.create('invalid-slug', mockAuthor, {
          comment: { body: 'Nice article' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return comment', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(mockArticle);

      const result = await commentsService.create(
        'test-article-slug',
        mockAuthor,
        {
          comment: { body: 'Great read!' },
        },
      );

      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        body: 'Great read!',
        author: mockAuthor,
        article: mockArticle,
      });
      expect(result.comment.body).toBe('Great read!');
      expect(result.comment.author.username).toBe('binh');
      expect(result.comment.author.following).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should throw NotFoundException if article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(null);

      await expect(commentsService.findAll('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return list of comments and correctly map following status', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(mockArticle);
      const mockComments = [
        {
          id: 1,
          body: 'Comment 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 2, username: 'user2', bio: null, image: null },
        },
      ];
      mockCommentRepository.find.mockResolvedValueOnce(mockComments);
      mockProfilesService.getFollowedAuthorIds.mockResolvedValueOnce(
        new Set([2]),
      );

      const result = await commentsService.findAll('test-article-slug', 1);

      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { article: { id: mockArticle.id } },
        relations: { author: true },
        order: { createdAt: 'DESC' },
      });
      expect(mockProfilesService.getFollowedAuthorIds).toHaveBeenCalledWith(
        1,
        [2],
      );
      expect(result.comments.length).toBe(1);
      expect(result.comments[0].body).toBe('Comment 1');
      expect(result.comments[0].author.following).toBe(true);
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if article not found', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        commentsService.delete('invalid-slug', 1, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if comment not found for the given article', async () => {
      const otherArticle = {
        id: 2,
        slug: 'other-article-slug',
        title: 'Other Article',
      } as Article;
      mockArticleRepository.findOne.mockResolvedValueOnce(otherArticle);
      mockCommentRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        commentsService.delete('other-article-slug', 1, 1),
      ).rejects.toThrow(NotFoundException);

      expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, article: { id: otherArticle.id } },
        relations: { author: true },
      });
    });

    it('should throw ForbiddenException if user is not author of comment', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(mockArticle);
      mockCommentRepository.findOne.mockResolvedValueOnce({
        id: 1,
        author: { id: 99 },
      });

      await expect(
        commentsService.delete('test-article-slug', 1, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should filter comment by article.id and remove comment when user is author', async () => {
      mockArticleRepository.findOne.mockResolvedValueOnce(mockArticle);
      const existingComment = {
        id: 1,
        author: { id: 1 },
      };
      mockCommentRepository.findOne.mockResolvedValueOnce(existingComment);

      await commentsService.delete('test-article-slug', 1, 1);

      expect(mockCommentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, article: { id: mockArticle.id } },
        relations: { author: true },
      });
      expect(mockCommentRepository.remove).toHaveBeenCalledWith(
        existingComment,
      );
    });
  });
});
