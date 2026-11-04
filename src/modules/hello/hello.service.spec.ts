import { describe, expect, it, vi } from 'vitest';
import { I18nContext } from 'nestjs-i18n';
import { HelloService } from './hello.service.js';

describe('HelloService', () => {
  const service = new HelloService();

  it('should return hello greeting response with requested lang', async () => {
    const mockI18n = {
      lang: 'en',
      translate: vi.fn().mockImplementation((key: string) => {
        if (key === 'hello.greeting')
          return Promise.resolve('Xin chào thế giới!');
        if (key === 'hello.welcome')
          return Promise.resolve(
            'Chào mừng bạn đến với Conduit RealWorld API!',
          );
        return Promise.resolve(key);
      }),
    } as unknown as I18nContext;

    const result = await service.getGreeting(mockI18n, 'vi');

    expect(result).toHaveProperty('message', 'Xin chào thế giới!');
    expect(result).toHaveProperty(
      'welcome',
      'Chào mừng bạn đến với Conduit RealWorld API!',
    );
    expect(result).toHaveProperty('lang', 'vi');
    expect(result).toHaveProperty('timestamp');
  });

  it('should fallback to i18n default lang when requestedLang is undefined', async () => {
    const mockI18n = {
      lang: 'en',
      translate: vi.fn().mockImplementation((key: string) => {
        if (key === 'hello.greeting') return Promise.resolve('Hello World!');
        if (key === 'hello.welcome')
          return Promise.resolve('Welcome to Conduit RealWorld API!');
        return Promise.resolve(key);
      }),
    } as unknown as I18nContext;

    const result = await service.getGreeting(mockI18n, undefined);

    expect(result.lang).toBe('en');
    expect(result.message).toBe('Hello World!');
  });
});
