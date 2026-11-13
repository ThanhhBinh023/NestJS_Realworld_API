import { ApiProperty } from '@nestjs/swagger';
import { CommentDataDto } from './comment-response.dto.js';

export class CommentsListResponseDto {
  @ApiProperty({
    type: [CommentDataDto],
    description: 'List of comments on the article',
  })
  comments!: CommentDataDto[];
}
