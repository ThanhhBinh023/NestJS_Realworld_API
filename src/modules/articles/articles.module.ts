import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { ArticlesController } from './articles.controller.js';
import { ArticlesService } from './articles.service.js';
import { TagsModule } from '../tags/tags.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Favorite]),
    TagsModule,
    UsersModule,
    AuthModule,
    ProfilesModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService, TypeOrmModule],
})
export class ArticlesModule {}
