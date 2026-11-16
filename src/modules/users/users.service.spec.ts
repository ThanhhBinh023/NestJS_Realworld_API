import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockUserRepository: any;

  const mockUser: User = {
    id: 1,
    email: 'binh@test.com',
    username: 'binh',
    password: 'hashedpassword',
    bio: 'Software engineer',
    image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepository = {
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation((user) => ({
        ...user,
        id: user.id ?? 1,
        updatedAt: new Date(),
      })),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    usersService = new UsersService(mockUserRepository);
  });

  describe('updateAvatar', () => {
    it('should throw UnprocessableEntityException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        usersService.updateAvatar(99, '/uploads/avatars/new.png'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should update user.image and save user', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...mockUser });

      const updated = await usersService.updateAvatar(
        1,
        '/uploads/avatars/avatar-123.png',
      );

      expect(updated.image).toBe('/uploads/avatars/avatar-123.png');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user fields successfully', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ ...mockUser });

      const result = await usersService.update(1, {
        user: {
          bio: 'New bio',
          image: 'https://new-image.png',
        },
      });

      expect(result.bio).toBe('New bio');
      expect(result.image).toBe('https://new-image.png');
    });

    it('should throw if email already taken by another user', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce({ ...mockUser }) // findById
        .mockResolvedValueOnce({ id: 2, email: 'taken@test.com' }); // findByEmail

      await expect(
        usersService.update(1, {
          user: { email: 'taken@test.com' },
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('buildUserResponse', () => {
    it('should format response according to RealWorld user schema', () => {
      const response = usersService.buildUserResponse(mockUser, 'test-token');

      expect(response).toEqual({
        user: {
          email: 'binh@test.com',
          token: 'test-token',
          username: 'binh',
          bio: 'Software engineer',
          image: 'https://api.realworld.io/images/smiley-cyrus.jpg',
        },
      });
    });
  });
});
