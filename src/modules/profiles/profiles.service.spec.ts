import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProfilesService } from './profiles.service.js';

describe('ProfilesService', () => {
  let profilesService: ProfilesService;
  let mockUserRepository: any;
  let mockFollowRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findOne: vi.fn(),
    };
    mockFollowRepository = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn(),
      delete: vi.fn(),
    };

    profilesService = new ProfilesService(
      mockUserRepository,
      mockFollowRepository,
    );
  });

  describe('getProfile', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(profilesService.getProfile('unknown_user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return profile with following false when visitor is unauthenticated', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'jake',
        bio: 'skateboarder',
        image: 'avatar.jpg',
      });

      const res = await profilesService.getProfile('jake');

      expect(res.profile.username).toBe('jake');
      expect(res.profile.following).toBe(false);
    });

    it('should return profile with following true when current user follows target', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'jake',
        bio: 'skateboarder',
        image: 'avatar.jpg',
      });
      mockFollowRepository.findOne.mockResolvedValueOnce({
        followerId: 1,
        followingId: 2,
      });

      const res = await profilesService.getProfile('jake', 1);

      expect(res.profile.username).toBe('jake');
      expect(res.profile.following).toBe(true);
    });
  });

  describe('followUser', () => {
    it('should throw BadRequestException when attempting to follow oneself', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 1,
        username: 'self',
      });

      await expect(profilesService.followUser('self', 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create follow record and return following true', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'jake',
        bio: null,
        image: null,
      });
      mockFollowRepository.findOne.mockResolvedValueOnce(null);

      const res = await profilesService.followUser('jake', 1);

      expect(mockFollowRepository.save).toHaveBeenCalled();
      expect(res.profile.following).toBe(true);
    });
  });

  describe('unfollowUser', () => {
    it('should delete follow record and return following false', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'jake',
        bio: null,
        image: null,
      });

      const res = await profilesService.unfollowUser('jake', 1);

      expect(mockFollowRepository.delete).toHaveBeenCalledWith({
        followerId: 1,
        followingId: 2,
      });
      expect(res.profile.following).toBe(false);
    });
  });
});
