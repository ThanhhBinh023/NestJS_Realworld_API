import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
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
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { CommentResponseDto } from './dto/comment-response.dto.js';
import { CommentsListResponseDto } from './dto/comments-list-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';

@ApiTags('Comments')
@Controller('articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add comments to an article' })
  @ApiCreatedResponse({
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed',
  })
  async create(
    @Param('slug') slug: string,
    @CurrentUser() author: User,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(slug, author, createCommentDto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get comments from an article' })
  @ApiOkResponse({
    description: 'List of comments',
    type: CommentsListResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Article not found',
  })
  async findAll(
    @Param('slug') slug: string,
    @CurrentUser('id') currentUserId?: number,
  ): Promise<CommentsListResponseDto> {
    return this.commentsService.findAll(slug, currentUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a comment from an article' })
  @ApiOkResponse({
    description: 'Comment deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiForbiddenResponse({
    description: 'Caller is not the author of this comment',
  })
  @ApiNotFoundResponse({
    description: 'Article or comment not found',
  })
  async delete(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') currentUserId: number,
  ): Promise<{ message: string }> {
    await this.commentsService.delete(slug, id, currentUserId);
    return { message: 'Comment deleted successfully' };
  }
}
