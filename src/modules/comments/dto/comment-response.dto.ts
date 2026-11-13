import { ApiProperty } from '@nestjs/swagger';
import { ProfileDto } from '../../profiles/dto/profile-response.dto.js';

export class CommentDataDto {
  @ApiProperty({
    example: 1,
    description: 'Unique ID of the comment',
  })
  id!: number;

  @ApiProperty({
    example: '2026-11-13T07:00:00.000Z',
    description: 'Comment creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-11-13T07:00:00.000Z',
    description: 'Comment last update timestamp',
  })
  updatedAt!: Date;

  @ApiProperty({
    example: 'His name was my name too.',
    description: 'The body content of the comment',
  })
  body!: string;

  @ApiProperty({
    type: ProfileDto,
    description: 'Author profile of the comment',
  })
  author!: ProfileDto;
}

export class CommentResponseDto {
  @ApiProperty({ type: CommentDataDto })
  comment!: CommentDataDto;
}
