import { ApiProperty } from '@nestjs/swagger';

export class UserDataDto {
  @ApiProperty({ example: 'binh@binh.binh', description: 'User email address' })
  email!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT authentication token',
  })
  token!: string;

  @ApiProperty({ example: 'Binh', description: 'Username' })
  username!: string;

  @ApiProperty({
    example: 'I work at statefarm',
    nullable: true,
    description: 'User biography',
  })
  bio!: string | null;

  @ApiProperty({
    example: 'https://api.realworld.io/images/smiley-cyrus.jpg',
    nullable: true,
    description: 'User profile avatar URL',
  })
  image!: string | null;
}

export class UserResponseDto {
  @ApiProperty({ type: UserDataDto })
  user!: UserDataDto;
}
