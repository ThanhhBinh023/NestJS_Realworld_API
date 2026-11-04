import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Follow } from './entities/follow.entity.js';
import { ProfileResponseDto } from './dto/profile-response.dto.js';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async getProfile(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.userRepository.findOne({
      where: { username },
    });

    if (!targetUser) {
      throw new NotFoundException({
        errors: { profile: ['User not found'] },
      });
    }

    let following = false;
    if (currentUserId) {
      const followRecord = await this.followRepository.findOne({
        where: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      });
      following = Boolean(followRecord);
    }

    return this.buildProfileResponse(targetUser, following);
  }

  async followUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.userRepository.findOne({
      where: { username },
    });

    if (!targetUser) {
      throw new NotFoundException({
        errors: { profile: ['User not found'] },
      });
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException({
        errors: { user: ['You cannot follow yourself'] },
      });
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId: currentUserId,
        followingId: targetUser.id,
      },
    });

    if (!existingFollow) {
      const follow = this.followRepository.create({
        followerId: currentUserId,
        followingId: targetUser.id,
      });
      await this.followRepository.save(follow);
    }

    return this.buildProfileResponse(targetUser, true);
  }

  async unfollowUser(
    username: string,
    currentUserId: number,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.userRepository.findOne({
      where: { username },
    });

    if (!targetUser) {
      throw new NotFoundException({
        errors: { profile: ['User not found'] },
      });
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException({
        errors: { user: ['You cannot unfollow yourself'] },
      });
    }

    await this.followRepository.delete({
      followerId: currentUserId,
      followingId: targetUser.id,
    });

    return this.buildProfileResponse(targetUser, false);
  }

  buildProfileResponse(user: User, following: boolean): ProfileResponseDto {
    return {
      profile: {
        username: user.username,
        bio: user.bio ?? null,
        image: user.image ?? null,
        following,
      },
    };
  }
}
