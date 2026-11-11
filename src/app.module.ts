import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { User } from './modules/users/entities/user.entity.js';
import { Follow } from './modules/profiles/entities/follow.entity.js';
import { Article } from './modules/articles/entities/article.entity.js';
import { Tag } from './modules/tags/entities/tag.entity.js';
import { Favorite } from './modules/articles/entities/favorite.entity.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { ArticlesModule } from './modules/articles/articles.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { HelloModule } from './modules/hello/hello.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getI18nPath(): string {
  const rootSrcPath = path.join(process.cwd(), 'src', 'i18n');
  if (fs.existsSync(rootSrcPath)) {
    return rootSrcPath;
  }
  const distPath = path.join(__dirname, 'i18n');
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  return path.join(process.cwd(), 'i18n');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '3306'), 10),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', '123456'),
        database: configService.get<string>('DB_NAME', 'realworld_nest'),
        entities: [User, Follow, Article, Tag, Favorite],
        synchronize: false,
        logging: false,
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: getI18nPath(),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
    TagsModule,
    ArticlesModule,
    HelloModule,
  ],
})
export class AppModule {}
