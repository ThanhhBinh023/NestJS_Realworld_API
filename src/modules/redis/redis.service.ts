import { createHash } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.provider.js';

const BLACKLIST_KEY_PREFIX = 'blacklist:jwt:';

/**
 * Manages JWT token blacklisting in Redis with an in-memory TTL fallback
 * when Redis is not configured or unreachable in local/test environments.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryBlacklist = new Map<string, number>();
  private redisAvailable = false;

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis | null,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.connect();
      this.redisAvailable = this.redisClient.status === 'ready';
    } catch {
      this.redisAvailable = false;
      this.logger.warn(
        'Redis server unavailable; using in-memory token blacklist fallback',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.quit();
    } catch {
      this.redisClient.disconnect();
    }
  }

  private buildBlacklistKey(token: string): string {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return `${BLACKLIST_KEY_PREFIX}${tokenHash}`;
  }

  private purgeExpiredFromMemory(key: string): boolean {
    const expiresAt = this.memoryBlacklist.get(key);
    if (expiresAt === undefined) {
      return false;
    }
    if (Date.now() >= expiresAt) {
      this.memoryBlacklist.delete(key);
      return false;
    }
    return true;
  }

  /** Stores a revoked JWT token in the blacklist for its remaining lifetime. */
  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    const key = this.buildBlacklistKey(token);

    if (this.redisClient && this.redisAvailable) {
      try {
        await this.redisClient.set(key, '1', 'EX', ttlSeconds);
        return;
      } catch (error) {
        this.logger.warn(
          'Failed to write blacklist token to Redis; falling back to memory',
          error,
        );
      }
    }

    this.memoryBlacklist.set(key, Date.now() + ttlSeconds * 1000);
  }

  /** Returns true if the given JWT token has been revoked via logout. */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = this.buildBlacklistKey(token);

    if (this.redisClient && this.redisAvailable) {
      try {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      } catch (error) {
        this.logger.warn(
          'Failed to check blacklist token in Redis; checking memory fallback',
          error,
        );
      }
    }

    return this.purgeExpiredFromMemory(key);
  }
}
