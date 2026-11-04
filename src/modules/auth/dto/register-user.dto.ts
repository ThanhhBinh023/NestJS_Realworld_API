import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RegisterUserDataDto {
  @ApiProperty({
    example: 'Jacob',
    description: 'Unique username for the account',
  })
  @IsNotEmpty({ message: 'username should not be empty' })
  @IsString({ message: 'username must be a string' })
  username!: string;

  @ApiProperty({
    example: 'jake@jake.jake',
    description: 'Unique user email address',
  })
  @IsNotEmpty({ message: 'email should not be empty' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  @ApiProperty({
    example: 'jakejakejake',
    description: 'User password (minimum 6 characters)',
  })
  @IsNotEmpty({ message: 'password should not be empty' })
  @IsString({ message: 'password must be a string' })
  @MinLength(6, {
    message: 'password must be longer than or equal to 6 characters',
  })
  password!: string;
}

export class RegisterUserDto {
  @ApiProperty({ type: RegisterUserDataDto })
  @ValidateNested()
  @Type(() => RegisterUserDataDto)
  @IsNotEmpty()
  user!: RegisterUserDataDto;
}
