import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';
import { ArticleResponseDto } from './dto/article-response.dto.js';
import { ArticlesQueryDto } from './dto/articles-query.dto.js';
import { ArticlesFeedQueryDto } from './dto/articles-feed-query.dto.js';
import { ArticlesListResponseDto } from './dto/articles-list-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get most recent articles globally',
    description:
      'Filter by tag, author or favorited. Supports pagination via limit and offset.',
  })
  @ApiOkResponse({
    description: 'List of articles with total count',
    type: ArticlesListResponseDto,
  })
  async findAll(
    @Query() query: ArticlesQueryDto,
    @CurrentUser('id') currentUserId?: number,
  ): Promise<ArticlesListResponseDto> {
    return this.articlesService.findAll(query, currentUserId);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get most recent articles from users you follow',
    description:
      'Returns feed of articles created by followed authors, ordered by most recent.',
  })
  @ApiOkResponse({
    description: 'Feed of articles with total count',
    type: ArticlesListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  async getFeed(
    @Query() query: ArticlesFeedQueryDto,
    @CurrentUser('id') currentUserId: number,
  ): Promise<ArticlesListResponseDto> {
    return this.articlesService.findFeed(query, currentUserId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create an article' })
  @ApiCreatedResponse({
    description: 'Article created successfully',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed',
  })
  async create(
    @CurrentUser() author: User,
    @Body() createArticleDto: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.create(author, createArticleDto);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get an article by slug' })
  @ApiOkResponse({
    description: 'Article details',
    type: ArticleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  async getArticle(
    @Param('slug') slug: string,
    @CurrentUser('id') currentUserId?: number,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.findBySlug(slug, currentUserId);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an article' })
  @ApiOkResponse({
    description: 'Article updated successfully',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiForbiddenResponse({
    description: 'Caller is not the author of this article',
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  async updateArticle(
    @Param('slug') slug: string,
    @CurrentUser('id') currentUserId: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.update(slug, currentUserId, updateArticleDto);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an article' })
  @ApiOkResponse({
    description: 'Article deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiForbiddenResponse({
    description: 'Caller is not the author of this article',
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  async deleteArticle(
    @Param('slug') slug: string,
    @CurrentUser('id') currentUserId: number,
  ): Promise<{ message: string }> {
    await this.articlesService.delete(slug, currentUserId);
    return { message: 'Article deleted successfully' };
  }

  @Post(':slug/favorite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Favorite an article' })
  @ApiOkResponse({
    description: 'Favorited article details',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  async favoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser('id') currentUserId: number,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.favorite(slug, currentUserId);
  }

  @Delete(':slug/favorite')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unfavorite an article' })
  @ApiOkResponse({
    description: 'Unfavorited article details',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  async unfavoriteArticle(
    @Param('slug') slug: string,
    @CurrentUser('id') currentUserId: number,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.unfavorite(slug, currentUserId);
  }
}
