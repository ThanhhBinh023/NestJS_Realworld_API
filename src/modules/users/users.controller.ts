import {
  BadRequestException,
  Body,
  Controller,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { UploadAvatarDto } from './dto/upload-avatar.dto.js';
import { avatarMulterOptions } from './utils/multer-avatar.config.js';
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
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Email or username already taken',
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

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'avatar', maxCount: 1 },
      ],
      avatarMulterOptions,
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  @ApiOperation({ summary: 'Upload avatar image for current user' })
  @ApiOkResponse({
    description: 'Avatar uploaded and user image updated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format or file size exceeded',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  async uploadAvatar(
    @CurrentUser('id') userId: number,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; avatar?: Express.Multer.File[] },
    @Req() req: Request,
  ): Promise<UserResponseDto> {
    const uploadedFile = files?.file?.[0] || files?.avatar?.[0];
    if (!uploadedFile) {
      throw new BadRequestException({
        errors: { file: ['Image file is required'] },
      });
    }

    const avatarUrl = `/uploads/avatars/${uploadedFile.filename}`;
    const updatedUser = await this.usersService.updateAvatar(userId, avatarUrl);
    const token =
      extractJwtToken(req) ?? this.authService.generateToken(updatedUser);
    return this.usersService.buildUserResponse(updatedUser, token);
  }
}
