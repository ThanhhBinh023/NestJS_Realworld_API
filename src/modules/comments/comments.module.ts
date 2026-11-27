import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity.js';
import { Article } from '../articles/entities/article.entity.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Article]),
    AuthModule,
    ProfilesModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
