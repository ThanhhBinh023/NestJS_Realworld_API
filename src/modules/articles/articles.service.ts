import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Article } from './entities/article.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Follow } from '../profiles/entities/follow.entity.js';
import { TagsService } from '../tags/tags.service.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';
import { ArticleResponseDto } from './dto/article-response.dto.js';
import { ArticlesQueryDto } from './dto/articles-query.dto.js';
import { ArticlesFeedQueryDto } from './dto/articles-feed-query.dto.js';
import { ArticlesListResponseDto } from './dto/articles-list-response.dto.js';
import { createBaseSlug } from '../../common/utils/slugify.util.js';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    private readonly tagsService: TagsService,
  ) {}

  async create(
    author: User,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    const { title, description, body, tagList } = createArticleDto.article;

    const slug = await this.generateUniqueSlug(title);
    const tags = await this.tagsService.findOrCreateTags(tagList ?? []);

    const article = this.articleRepository.create({
      title,
      description,
      body,
      slug,
      author,
      tags,
      favoritesCount: 0,
    });

    const savedArticle = await this.articleRepository.save(article);
    return this.buildArticleResponse(savedArticle, false, false);
  }

  async findAll(
    query: ArticlesQueryDto,
    currentUserId?: number,
  ): Promise<ArticlesListResponseDto> {
    const { tag, author, favorited, limit = 20, offset = 0 } = query;

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tag')
      .orderBy('article.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (tag) {
      qb.andWhere(
        'article.id IN (SELECT at.articleId FROM articles_tags at JOIN tags t ON t.id = at.tagId WHERE t.name = :tag)',
        { tag },
      );
    }

    if (author) {
      qb.andWhere('author.username = :author', { author });
    }

    if (favorited) {
      qb.andWhere(
        'article.id IN (SELECT f.articleId FROM favorites f JOIN users u ON u.id = f.userId WHERE u.username = :favorited)',
        { favorited },
      );
    }

    const [articles, articlesCount] = await qb.getManyAndCount();

    const followedAuthorIds = await this.getFollowedAuthorIds(currentUserId);
    const favoritedArticleIds = await this.getFavoritedArticleIds(
      currentUserId,
      articles.map((a) => a.id),
    );

    return {
      articles: articles.map(
        (article) =>
          this.buildArticleResponse(
            article,
            followedAuthorIds.has(article.author.id),
            favoritedArticleIds.has(article.id),
          ).article,
      ),
      articlesCount,
    };
  }

  async findFeed(
    query: ArticlesFeedQueryDto,
    currentUserId: number,
  ): Promise<ArticlesListResponseDto> {
    const { limit = 20, offset = 0 } = query;

    const follows = await this.followRepository.find({
      where: { followerId: currentUserId },
    });

    if (!follows || follows.length === 0) {
      return {
        articles: [],
        articlesCount: 0,
      };
    }

    const followingIds = follows.map((f) => f.followingId);

    const [articles, articlesCount] = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tag')
      .where('article.authorId IN (:...followingIds)', { followingIds })
      .orderBy('article.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const favoritedArticleIds = await this.getFavoritedArticleIds(
      currentUserId,
      articles.map((a) => a.id),
    );

    return {
      articles: articles.map(
        (article) =>
          this.buildArticleResponse(
            article,
            true,
            favoritedArticleIds.has(article.id),
          ).article,
      ),
      articlesCount,
    };
  }

  async findBySlug(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: { author: true, tags: true },
    });

    if (!article) {
      throw new NotFoundException({
        errors: { article: ['not found'] },
      });
    }

    const isFollowing = await this.checkIsFollowing(
      currentUserId,
      article.author.id,
    );
    const isFavorited = await this.checkIsFavorited(currentUserId, article.id);

    return this.buildArticleResponse(article, isFollowing, isFavorited);
  }

  async update(
    slug: string,
    currentUserId: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: { author: true, tags: true },
    });

    if (!article) {
      throw new NotFoundException({
        errors: { article: ['not found'] },
      });
    }

    if (article.author.id !== currentUserId) {
      throw new ForbiddenException({
        errors: { article: ['You are not the author of this article'] },
      });
    }

    const { title, description, body } = updateArticleDto.article;

    if (title && title !== article.title) {
      article.title = title;
      article.slug = await this.generateUniqueSlug(title, article.id);
    }

    if (description !== undefined) {
      article.description = description;
    }

    if (body !== undefined) {
      article.body = body;
    }

    const updated = await this.articleRepository.save(article);
    const isFavorited = await this.checkIsFavorited(currentUserId, updated.id);

    return this.buildArticleResponse(updated, false, isFavorited);
  }

  async delete(slug: string, currentUserId: number): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: { author: true },
    });

    if (!article) {
      throw new NotFoundException({
        errors: { article: ['not found'] },
      });
    }

    if (article.author.id !== currentUserId) {
      throw new ForbiddenException({
        errors: { article: ['You are not the author of this article'] },
      });
    }

    await this.articleRepository.remove(article);
  }

  async favorite(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: { author: true, tags: true },
    });

    if (!article) {
      throw new NotFoundException({
        errors: { article: ['not found'] },
      });
    }

    const existing = await this.favoriteRepository.findOne({
      where: { userId: currentUserId, articleId: article.id },
    });

    if (!existing) {
      const fav = this.favoriteRepository.create({
        userId: currentUserId,
        articleId: article.id,
      });
      await this.favoriteRepository.save(fav);
      article.favoritesCount = (article.favoritesCount ?? 0) + 1;
      await this.articleRepository.save(article);
    }

    const isFollowing = await this.checkIsFollowing(
      currentUserId,
      article.author.id,
    );

    return this.buildArticleResponse(article, isFollowing, true);
  }

  async unfavorite(
    slug: string,
    currentUserId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: { author: true, tags: true },
    });

    if (!article) {
      throw new NotFoundException({
        errors: { article: ['not found'] },
      });
    }

    const existing = await this.favoriteRepository.findOne({
      where: { userId: currentUserId, articleId: article.id },
    });

    if (existing) {
      await this.favoriteRepository.remove(existing);
      article.favoritesCount = Math.max(0, (article.favoritesCount ?? 1) - 1);
      await this.articleRepository.save(article);
    }

    const isFollowing = await this.checkIsFollowing(
      currentUserId,
      article.author.id,
    );

    return this.buildArticleResponse(article, isFollowing, false);
  }

  async generateUniqueSlug(
    title: string,
    currentArticleId?: number,
  ): Promise<string> {
    const baseSlug = createBaseSlug(title);
    let candidateSlug = baseSlug;

    const existing = await this.articleRepository.findOne({
      where: { slug: candidateSlug },
    });

    if (existing && existing.id !== currentArticleId) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      candidateSlug = `${baseSlug}-${uniqueSuffix}`;
    }

    return candidateSlug;
  }

  private async getFollowedAuthorIds(
    currentUserId?: number,
  ): Promise<Set<number>> {
    if (!currentUserId) {
      return new Set();
    }
    const userFollows = await this.followRepository.find({
      where: { followerId: currentUserId },
    });
    return new Set(userFollows.map((f) => f.followingId));
  }

  private async getFavoritedArticleIds(
    currentUserId?: number,
    articleIds?: number[],
  ): Promise<Set<number>> {
    if (!currentUserId || !articleIds || articleIds.length === 0) {
      return new Set();
    }
    const favorites = await this.favoriteRepository.find({
      where: {
        userId: currentUserId,
        articleId: In(articleIds),
      },
    });
    return new Set(favorites.map((f) => f.articleId));
  }

  private async checkIsFavorited(
    currentUserId?: number,
    articleId?: number,
  ): Promise<boolean> {
    if (!currentUserId || !articleId) {
      return false;
    }
    const favorite = await this.favoriteRepository.findOne({
      where: { userId: currentUserId, articleId },
    });
    return Boolean(favorite);
  }

  private async checkIsFollowing(
    followerId?: number,
    followingId?: number,
  ): Promise<boolean> {
    if (!followerId || !followingId || followerId === followingId) {
      return false;
    }
    const follow = await this.followRepository.findOne({
      where: { followerId, followingId },
    });
    return Boolean(follow);
  }

  buildArticleResponse(
    article: Article,
    following: boolean,
    favorited: boolean,
  ): ArticleResponseDto {
    return {
      article: {
        slug: article.slug,
        title: article.title,
        description: article.description,
        body: article.body,
        tagList: article.tags?.map((t) => t.name) ?? [],
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        favorited,
        favoritesCount: article.favoritesCount ?? 0,
        author: {
          username: article.author.username,
          bio: article.author.bio ?? null,
          image: article.author.image ?? null,
          following,
        },
      },
    };
  }
}
