import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/entities/user.entity.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<UserResponseDto> {
    const { username, email, password } = registerDto.user;

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new UnprocessableEntityException({
        errors: {
          email: ['has already been taken'],
        },
      });
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new UnprocessableEntityException({
        errors: {
          username: ['has already been taken'],
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.usersService.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = this.generateToken(newUser);
    return this.usersService.buildUserResponse(newUser, token);
  }

  async login(loginDto: LoginUserDto): Promise<UserResponseDto> {
    const { email, password } = loginDto.user;

    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnprocessableEntityException({
        errors: {
          'email or password': ['is invalid'],
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        errors: {
          'email or password': ['is invalid'],
        },
      });
    }

    const token = this.generateToken(user);
    return this.usersService.buildUserResponse(user, token);
  }

  generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  getCurrentUser(user: User, token: string): UserResponseDto {
    return this.usersService.buildUserResponse(user, token);
  }
}
