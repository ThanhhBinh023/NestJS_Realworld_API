import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity.js';
import { Article } from '../articles/entities/article.entity.js';
import { Follow } from '../profiles/entities/follow.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import {
  CommentDataDto,
  CommentResponseDto,
} from './dto/comment-response.dto.js';
import { CommentsListResponseDto } from './dto/comments-list-response.dto.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async create(
    slug: string,
    author: User,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const article = await this.findArticleBySlug(slug);

    const comment = this.commentRepository.create({
      body: createCommentDto.comment.body,
      author,
      article,
    });

    const savedComment = await this.commentRepository.save(comment);

    return {
      comment: this.buildCommentDto(savedComment, false),
    };
  }

  async findAll(
    slug: string,
    currentUserId?: number,
  ): Promise<CommentsListResponseDto> {
    const article = await this.findArticleBySlug(slug);

    const comments = await this.commentRepository.find({
      where: { article: { id: article.id } },
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });

    let followedAuthorIds = new Set<number>();
    if (currentUserId) {
      const userFollows = await this.followRepository.find({
        where: { followerId: currentUserId },
      });
      followedAuthorIds = new Set(userFollows.map((f) => f.followingId));
    }

    return {
      comments: comments.map((comment) =>
        this.buildCommentDto(comment, followedAuthorIds.has(comment.author.id)),
      ),
    };
  }

  async delete(
    slug: string,
    commentId: number,
    currentUserId: number,
  ): Promise<void> {
    const article = await this.findArticleBySlug(slug);

    const comment = await this.commentRepository.findOne({
      where: { id: commentId, article: { id: article.id } },
      relations: { author: true },
    });

    if (!comment) {
      throw new NotFoundException({
        errors: { comment: ['not found'] },
      });
    }

    if (comment.author.id !== currentUserId) {
      throw new ForbiddenException({
        errors: { comment: ['You are not the author of this comment'] },
      });
    }

    await this.commentRepository.remove(comment);
  }

  private async findArticleBySlug(slug: string): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { slug },
    });

    if (!article) {
      throw new NotFoundException({
        errors: { article: ['not found'] },
      });
    }

    return article;
  }

  private buildCommentDto(
    comment: Comment,
    following: boolean,
  ): CommentDataDto {
    return {
      id: comment.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      body: comment.body,
      author: {
        username: comment.author.username,
        bio: comment.author.bio ?? null,
        image: comment.author.image ?? null,
        following,
      },
    };
  }
}
