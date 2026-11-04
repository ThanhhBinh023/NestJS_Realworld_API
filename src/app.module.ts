import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { HelloModule } from './modules/hello/hello.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getI18nPath(): string {
  const distPath = path.join(__dirname, 'i18n');
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  const rootSrcPath = path.join(process.cwd(), 'src', 'i18n');
  if (fs.existsSync(rootSrcPath)) {
    return rootSrcPath;
  }
  return path.join(process.cwd(), 'i18n');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    HelloModule,
  ],
})
export class AppModule {}
