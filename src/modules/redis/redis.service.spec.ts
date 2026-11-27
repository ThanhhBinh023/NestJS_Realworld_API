import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Redis } from 'ioredis';
import { RedisService } from './redis.service.js';

describe('RedisService', () => {
  describe('with active Redis client', () => {
    let mockRedisClient: {
      connect: ReturnType<typeof vi.fn>;
      quit: ReturnType<typeof vi.fn>;
      set: ReturnType<typeof vi.fn>;
      exists: ReturnType<typeof vi.fn>;
      status: string;
    };
    let redisService: RedisService;

    beforeEach(async () => {
      mockRedisClient = {
        connect: vi.fn().mockResolvedValue(undefined),
        quit: vi.fn().mockResolvedValue('OK'),
        set: vi.fn().mockResolvedValue('OK'),
        exists: vi.fn().mockResolvedValue(0),
        status: 'ready',
      };

      redisService = new RedisService(mockRedisClient as unknown as Redis);
      await redisService.onModuleInit();
    });

    it('should store blacklisted token in Redis with EX TTL', async () => {
      await redisService.blacklistToken('sample.jwt.token', 3600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        expect.stringMatching(/^blacklist:jwt:[a-f0-9]{64}$/),
        '1',
        'EX',
        3600,
      );
    });

    it('should ignore blacklist request when ttlSeconds <= 0', async () => {
      await redisService.blacklistToken('expired.jwt.token', 0);

      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });

    it('should return true when Redis reports token key exists', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);

      const isBlacklisted =
        await redisService.isTokenBlacklisted('revoked.jwt.token');

      expect(isBlacklisted).toBe(true);
    });
  });

  describe('with in-memory fallback', () => {
    it('should blacklist and check tokens in memory when Redis client is null', async () => {
      const redisService = new RedisService(null);
      await redisService.onModuleInit();

      expect(await redisService.isTokenBlacklisted('token-1')).toBe(false);

      await redisService.blacklistToken('token-1', 60);
      expect(await redisService.isTokenBlacklisted('token-1')).toBe(true);
    });
  });
});
