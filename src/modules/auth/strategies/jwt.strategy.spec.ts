import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersService } from '../../users/users.service.js';
import { RedisService } from '../../redis/redis.service.js';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let mockUsersService: { findById: ReturnType<typeof vi.fn> };
  let mockRedisService: { isTokenBlacklisted: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockConfigService = {
      get: vi.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    mockUsersService = {
      findById: vi.fn(),
    };

    mockRedisService = {
      isTokenBlacklisted: vi.fn().mockResolvedValue(false),
    };

    jwtStrategy = new JwtStrategy(
      mockConfigService,
      mockUsersService as unknown as UsersService,
      mockRedisService as unknown as RedisService,
    );
  });

  it('should throw UnauthorizedException when token is blacklisted', async () => {
    mockRedisService.isTokenBlacklisted.mockResolvedValueOnce(true);

    const req = {
      headers: { authorization: 'Token revoked.jwt.token' },
    } as unknown as Request;

    await expect(
      jwtStrategy.validate(req, { sub: 1, email: 'binh@test.com' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(mockRedisService.isTokenBlacklisted).toHaveBeenCalledWith(
      'revoked.jwt.token',
    );
    expect(mockUsersService.findById).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    mockUsersService.findById.mockResolvedValueOnce(null);

    const req = {
      headers: { authorization: 'Bearer valid.jwt.token' },
    } as unknown as Request;

    await expect(
      jwtStrategy.validate(req, { sub: 99, email: 'missing@test.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return user when token is not blacklisted and user exists', async () => {
    const user = { id: 1, email: 'binh@test.com', username: 'binh' };
    mockUsersService.findById.mockResolvedValueOnce(user);

    const req = {
      headers: { authorization: 'Token valid.jwt.token' },
    } as unknown as Request;

    const result = await jwtStrategy.validate(req, {
      sub: 1,
      email: 'binh@test.com',
    });

    expect(result).toEqual(user);
  });
});
