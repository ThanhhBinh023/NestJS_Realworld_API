import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service.js';
import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('User and Profile')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get a user profile by username',
    description:
      'Returns the public profile of a user. If authenticated, reveals whether the caller follows the user.',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User profile not found',
  })
  async getProfile(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId?: number,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.getProfile(username, currentUserId);
  }

  @Post(':username/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiOkResponse({
    description: 'User followed successfully',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({
    description: 'User profile not found',
  })
  async followUser(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId: number,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.followUser(username, currentUserId);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiOkResponse({
    description: 'User unfollowed successfully',
    type: ProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid authentication token',
  })
  @ApiNotFoundResponse({
    description: 'User profile not found',
  })
  async unfollowUser(
    @Param('username') username: string,
    @CurrentUser('id') currentUserId: number,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.unfollowUser(username, currentUserId);
  }
}
