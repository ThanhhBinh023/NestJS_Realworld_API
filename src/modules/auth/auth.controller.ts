import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { extractJwtToken } from './strategies/jwt.strategy.js';

@ApiTags('Auth')
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Email or username already taken',
  })
  async register(
    @Body() registerDto: RegisterUserDto,
  ): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate an existing user' })
  @ApiOkResponse({
    description: 'User authenticated successfully',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid email or password',
  })
  async login(@Body() loginDto: LoginUserDto): Promise<UserResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke the current JWT token' })
  @ApiOkResponse({ description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or already revoked authentication token',
  })
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const token = extractJwtToken(req);
    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }
    return this.authService.logout(token);
  }
}
