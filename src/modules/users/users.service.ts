import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new UnprocessableEntityException({
        errors: { user: ['not found'] },
      });
    }

    const { email, username, password, bio, image } = updateUserDto.user;

    if (email && email !== user.email) {
      const existingEmail = await this.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        throw new UnprocessableEntityException({
          errors: { email: ['has already been taken'] },
        });
      }
      user.email = email;
    }

    if (username && username !== user.username) {
      const existingUsername = await this.findByUsername(username);
      if (existingUsername && existingUsername.id !== userId) {
        throw new UnprocessableEntityException({
          errors: { username: ['has already been taken'] },
        });
      }
      user.username = username;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (image !== undefined) {
      user.image = image;
    }

    return this.userRepository.save(user);
  }

  buildUserResponse(user: User, token: string): UserResponseDto {
    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio ?? null,
        image: user.image ?? null,
      },
    };
  }
}
