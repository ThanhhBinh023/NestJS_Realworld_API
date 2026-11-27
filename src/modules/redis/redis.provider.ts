import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Provides an ioredis client when REDIS_HOST is configured.
 * Returns null if REDIS_HOST is omitted so RedisService can fallback safely.
 */
export const RedisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): Redis | null => {
    const host = configService.get<string>('REDIS_HOST');
    if (!host) {
      return null;
    }

    const port = parseInt(configService.get<string>('REDIS_PORT', '6379'), 10);
    const password = configService.get<string>('REDIS_PASSWORD');

    const client = new Redis({
      host,
      port: Number.isNaN(port) ? 6379 : port,
      ...(password ? { password } : {}),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });

    // Prevent unhandled error events when Redis server is offline during tests
    client.on('error', () => undefined);

    return client;
  },
};
