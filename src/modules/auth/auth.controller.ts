import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';

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
  @ApiUnprocessableEntityResponse({
    description: 'Validation failed or email/username already taken',
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
  @ApiUnprocessableEntityResponse({
    description: 'Invalid email or password',
  })
  async login(@Body() loginDto: LoginUserDto): Promise<UserResponseDto> {
    return this.authService.login(loginDto);
  }
}
