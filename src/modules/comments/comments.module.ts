import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity.js';
import { Article } from '../articles/entities/article.entity.js';
import { Follow } from '../profiles/entities/follow.entity.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Article, Follow]), AuthModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
