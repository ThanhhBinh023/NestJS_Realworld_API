import { ApiProperty } from '@nestjs/swagger';
import { ProfileDto } from '../../profiles/dto/profile-response.dto.js';

export class ArticleDataDto {
  @ApiProperty({
    example: 'how-to-train-your-dragon',
    description: 'Unique article slug',
  })
  slug!: string;

  @ApiProperty({
    example: 'How to train your dragon',
    description: 'Title of the article',
  })
  title!: string;

  @ApiProperty({
    example: 'Ever wonder how?',
    description: 'Short description of the article',
  })
  description!: string;

  @ApiProperty({
    example: 'It takes a Jacobian',
    description: 'Full markdown body of the article',
  })
  body!: string;

  @ApiProperty({
    example: ['dragons', 'training'],
    description: 'Array of tag strings',
  })
  tagList!: string[];

  @ApiProperty({
    example: '2026-11-06T05:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-11-06T05:00:00.000Z',
    description: 'Last updated timestamp',
  })
  updatedAt!: Date;

  @ApiProperty({
    example: false,
    description:
      'Whether the current authenticated user favorited this article',
  })
  favorited!: boolean;

  @ApiProperty({
    example: 0,
    description: 'Number of users who favorited this article',
  })
  favoritesCount!: number;

  @ApiProperty({ type: ProfileDto, description: 'Author profile information' })
  author!: ProfileDto;
}

export class ArticleResponseDto {
  @ApiProperty({ type: ArticleDataDto })
  article!: ArticleDataDto;
}
