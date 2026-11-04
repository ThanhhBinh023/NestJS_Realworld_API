import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class LoginUserDataDto {
  @ApiProperty({
    example: 'jake@jake.jake',
    description: 'User email address',
  })
  @IsNotEmpty({ message: 'email should not be empty' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  @ApiProperty({
    example: 'jakejakejake',
    description: 'User password',
  })
  @IsNotEmpty({ message: 'password should not be empty' })
  @IsString({ message: 'password must be a string' })
  password!: string;
}

export class LoginUserDto {
  @ApiProperty({ type: LoginUserDataDto })
  @ValidateNested()
  @Type(() => LoginUserDataDto)
  @IsNotEmpty()
  user!: LoginUserDataDto;
}
