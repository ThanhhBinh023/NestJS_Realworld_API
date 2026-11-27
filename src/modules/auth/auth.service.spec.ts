import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockRedisService: any;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      create: vi.fn(),
      buildUserResponse: vi.fn().mockImplementation((user, token) => ({
        user: {
          email: user.email,
          token,
          username: user.username,
          bio: user.bio ?? null,
          image: user.image ?? null,
        },
      })),
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock.jwt.token'),
      decode: vi.fn(),
    };

    mockRedisService = {
      blacklistToken: vi.fn().mockResolvedValue(undefined),
    };

    authService = new AuthService(
      mockUsersService,
      mockJwtService,
      mockRedisService,
    );
  });

  describe('register', () => {
    const registerDto = {
      user: {
        username: 'binh',
        email: 'binh@binh.binh',
        password: 'password123',
      },
    };

    it('should throw UnprocessableEntityException if email is already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce({ id: 1 });

      await expect(authService.register(registerDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException if username is already taken', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.findByUsername.mockResolvedValueOnce({ id: 2 });

      await expect(authService.register(registerDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should create user, hash password and return user response with token', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.findByUsername.mockResolvedValueOnce(null);
      mockUsersService.create.mockResolvedValueOnce({
        id: 1,
        username: 'binh',
        email: 'binh@binh.binh',
        password: 'hashed_password',
        bio: null,
        image: null,
      });

      const result = await authService.register(registerDto);

      expect(result.user.email).toBe('binh@binh.binh');
      expect(result.user.username).toBe('binh');
      expect(result.user.token).toBe('mock.jwt.token');
    });
  });

  describe('login', () => {
    const loginDto = {
      user: {
        email: 'binh@binh.binh',
        password: 'password123',
      },
    };

    it('should throw UnprocessableEntityException if user is not found', async () => {
      mockUsersService.findByEmailWithPassword.mockResolvedValueOnce(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('different_password', 10);
      mockUsersService.findByEmailWithPassword.mockResolvedValueOnce({
        id: 1,
        email: 'binh@binh.binh',
        username: 'binh',
        password: hashedPassword,
      });

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should successfully authenticate and return user with token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmailWithPassword.mockResolvedValueOnce({
        id: 1,
        email: 'binh@binh.binh',
        username: 'binh',
        password: hashedPassword,
      });

      const result = await authService.login(loginDto);

      expect(result.user.email).toBe('binh@binh.binh');
      expect(result.user.token).toBe('mock.jwt.token');
    });
  });

  describe('logout', () => {
    it('should blacklist token in Redis with remaining TTL from exp claim', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 1800;
      mockJwtService.decode.mockReturnValueOnce({ exp: futureExp });

      const result = await authService.logout('valid.jwt.token');

      expect(mockRedisService.blacklistToken).toHaveBeenCalledWith(
        'valid.jwt.token',
        expect.any(Number),
      );
      const passedTtl = mockRedisService.blacklistToken.mock.calls[0][1];
      expect(passedTtl).toBeGreaterThan(1790);
      expect(passedTtl).toBeLessThanOrEqual(1800);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should fallback to default TTL when exp claim is absent', async () => {
      mockJwtService.decode.mockReturnValueOnce(null);

      await authService.logout('token.without.exp');

      expect(mockRedisService.blacklistToken).toHaveBeenCalledWith(
        'token.without.exp',
        7 * 24 * 60 * 60,
      );
    });
  });
});
