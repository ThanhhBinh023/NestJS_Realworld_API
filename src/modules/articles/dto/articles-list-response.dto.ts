import { ApiProperty } from '@nestjs/swagger';
import { ArticleDataDto } from './article-response.dto.js';

export class ArticlesListResponseDto {
  @ApiProperty({ type: [ArticleDataDto], description: 'List of articles' })
  articles!: ArticleDataDto[];

  @ApiProperty({
    example: 1,
    description: 'Total number of matching articles',
  })
  articlesCount!: number;
}
