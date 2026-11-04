import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateUserDataDto {
  @ApiPropertyOptional({
    example: 'binh@binh.binh',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'email must be a valid email' })
  email?: string;

  @ApiPropertyOptional({
    example: 'binh_updated',
    description: 'Updated username',
  })
  @IsOptional()
  @IsString({ message: 'username must be a string' })
  username?: string;

  @ApiPropertyOptional({
    example: 'newpassword123',
    description: 'New password (min 6 characters)',
  })
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  @MinLength(6, {
    message: 'password must be longer than or equal to 6 characters',
  })
  password?: string;

  @ApiPropertyOptional({
    example: 'I like to skateboard and code NestJS',
    description: 'Biography text',
  })
  @IsOptional()
  @IsString({ message: 'bio must be a string' })
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://api.realworld.io/images/smiley-cyrus.jpg',
    description: 'Profile avatar image URL',
  })
  @IsOptional()
  @IsString({ message: 'image must be a string' })
  image?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ type: UpdateUserDataDto })
  @ValidateNested()
  @Type(() => UpdateUserDataDto)
  @IsNotEmpty()
  user!: UpdateUserDataDto;
}
