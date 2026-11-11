import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateArticleDataDto {
  @ApiPropertyOptional({
    example: 'Did you train your dragon?',
    description: 'Updated title of the article',
  })
  @IsOptional()
  @IsString({ message: 'title must be a string' })
  title?: string;

  @ApiPropertyOptional({
    example: 'So how was it?',
    description: 'Updated description of the article',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({
    example: 'It takes a lot of time and patience.',
    description: 'Updated body of the article',
  })
  @IsOptional()
  @IsString({ message: 'body must be a string' })
  body?: string;
}

export class UpdateArticleDto {
  @ApiPropertyOptional({ type: UpdateArticleDataDto })
  @ValidateNested()
  @Type(() => UpdateArticleDataDto)
  @IsNotEmpty()
  article!: UpdateArticleDataDto;
}
