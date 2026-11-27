import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
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
      find: vi.fn().mockResolvedValue([]),
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
        username: 'binh',
        bio: 'skateboarder',
        image: 'avatar.jpg',
      });

      const res = await profilesService.getProfile('binh');

      expect(res.profile.username).toBe('binh');
      expect(res.profile.following).toBe(false);
    });

    it('should return profile with following true when current user follows target', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'binh',
        bio: 'skateboarder',
        image: 'avatar.jpg',
      });
      mockFollowRepository.findOne.mockResolvedValueOnce({
        followerId: 1,
        followingId: 2,
      });

      const res = await profilesService.getProfile('binh', 1);

      expect(res.profile.username).toBe('binh');
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
        username: 'binh',
        bio: null,
        image: null,
      });
      mockFollowRepository.findOne.mockResolvedValueOnce(null);

      const res = await profilesService.followUser('binh', 1);

      expect(mockFollowRepository.save).toHaveBeenCalled();
      expect(res.profile.following).toBe(true);
    });
  });

  describe('unfollowUser', () => {
    it('should delete follow record and return following false', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: 2,
        username: 'binh',
        bio: null,
        image: null,
      });

      const res = await profilesService.unfollowUser('binh', 1);

      expect(mockFollowRepository.delete).toHaveBeenCalledWith({
        followerId: 1,
        followingId: 2,
      });
      expect(res.profile.following).toBe(false);
    });
  });

  describe('getFollowedAuthorIds', () => {
    it('should return empty set without querying when userId missing or authorIds empty', async () => {
      expect(
        await profilesService.getFollowedAuthorIds(undefined, [1, 2]),
      ).toEqual(new Set());
      expect(await profilesService.getFollowedAuthorIds(1, [])).toEqual(
        new Set(),
      );
      expect(mockFollowRepository.find).not.toHaveBeenCalled();
    });

    it('should filter by unique authorIds using In(...) when authorIds provided', async () => {
      mockFollowRepository.find.mockResolvedValueOnce([
        { followerId: 1, followingId: 2 },
      ]);

      const result = await profilesService.getFollowedAuthorIds(1, [2, 3, 2]);

      expect(mockFollowRepository.find).toHaveBeenCalledWith({
        where: { followerId: 1, followingId: In([2, 3]) },
      });
      expect(result).toEqual(new Set([2]));
    });
  });

  describe('isFollowing', () => {
    it('should return false when followerId matches followingId or missing', async () => {
      expect(await profilesService.isFollowing(undefined, 2)).toBe(false);
      expect(await profilesService.isFollowing(2, 2)).toBe(false);
      expect(mockFollowRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return true when follow relationship exists', async () => {
      mockFollowRepository.findOne.mockResolvedValueOnce({ id: 1 });

      expect(await profilesService.isFollowing(1, 2)).toBe(true);
    });
  });
});
