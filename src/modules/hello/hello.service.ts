import { Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { HelloResponseDto } from './dto/hello-response.dto.js';

@Injectable()
export class HelloService {
  async getGreeting(
    i18n: I18nContext,
    requestedLang?: string,
  ): Promise<HelloResponseDto> {
    const lang = requestedLang ?? i18n?.lang ?? 'en';
    const message = (await i18n.translate('hello.greeting', {
      lang,
    })) as string;
    const welcome = (await i18n.translate('hello.welcome', {
      lang,
    })) as string;

    return {
      message,
      welcome,
      lang,
      timestamp: new Date().toISOString(),
    };
  }
}
