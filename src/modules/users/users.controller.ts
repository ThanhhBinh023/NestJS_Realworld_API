import {
  Body,
  Controller,
  forwardRef,
  Get,
  Inject,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from './entities/user.entity.js';
import { extractJwtToken } from '../auth/strategies/jwt.strategy.js';
import { AuthService } from '../auth/auth.service.js';

@ApiTags('User and Profile')
@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get currently authenticated user' })
  @ApiOkResponse({
    description: 'Current user profile data',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  async getCurrentUser(
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const token = extractJwtToken(req) ?? this.authService.generateToken(user);
    return this.usersService.buildUserResponse(user, token);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user' })
  @ApiOkResponse({
    description: 'User details updated successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed or email/username already taken',
  })
  async updateUser(
    @CurrentUser('id') userId: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    const token =
      extractJwtToken(req) ?? this.authService.generateToken(updatedUser);
    return this.usersService.buildUserResponse(updatedUser, token);
  }
}
