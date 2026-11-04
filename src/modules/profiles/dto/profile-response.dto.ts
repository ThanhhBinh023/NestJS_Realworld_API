import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty({
    example: 'jake',
    description: 'Username of the profile owner',
  })
  username!: string;

  @ApiProperty({
    example: 'I like to skateboard',
    nullable: true,
    description: 'Biography of the user',
  })
  bio!: string | null;

  @ApiProperty({
    example: 'https://api.realworld.io/images/smiley-cyrus.jpg',
    nullable: true,
    description: 'Profile avatar image URL',
  })
  image!: string | null;

  @ApiProperty({
    example: false,
    description:
      'Whether the current authenticated user is following this user',
  })
  following!: boolean;
}

export class ProfileResponseDto {
  @ApiProperty({ type: ProfileDto })
  profile!: ProfileDto;
}
