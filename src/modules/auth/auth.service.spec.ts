import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;

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
    };

    authService = new AuthService(mockUsersService, mockJwtService);
  });

  describe('register', () => {
    const registerDto = {
      user: {
        username: 'jake',
        email: 'jake@jake.jake',
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
        username: 'jake',
        email: 'jake@jake.jake',
        password: 'hashed_password',
        bio: null,
        image: null,
      });

      const result = await authService.register(registerDto);

      expect(result.user.email).toBe('jake@jake.jake');
      expect(result.user.username).toBe('jake');
      expect(result.user.token).toBe('mock.jwt.token');
    });
  });

  describe('login', () => {
    const loginDto = {
      user: {
        email: 'jake@jake.jake',
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
        email: 'jake@jake.jake',
        username: 'jake',
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
        email: 'jake@jake.jake',
        username: 'jake',
        password: hashedPassword,
      });

      const result = await authService.login(loginDto);

      expect(result.user.email).toBe('jake@jake.jake');
      expect(result.user.token).toBe('mock.jwt.token');
    });
  });
});
