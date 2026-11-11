import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateArticleDataDto {
  @ApiProperty({
    example: 'How to train your dragon',
    description: 'Title of the article',
  })
  @IsNotEmpty({ message: 'title should not be empty' })
  @IsString({ message: 'title must be a string' })
  title!: string;

  @ApiProperty({
    example: 'Ever wonder how?',
    description: 'Short description of the article',
  })
  @IsNotEmpty({ message: 'description should not be empty' })
  @IsString({ message: 'description must be a string' })
  description!: string;

  @ApiProperty({
    example: 'It takes a Jacobian',
    description: 'Body of the article',
  })
  @IsNotEmpty({ message: 'body should not be empty' })
  @IsString({ message: 'body must be a string' })
  body!: string;

  @ApiPropertyOptional({
    example: ['dragons', 'training'],
    description: 'Tags for the article',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'tagList must be an array' })
  @IsString({ each: true, message: 'each tag must be a string' })
  tagList?: string[];
}

export class CreateArticleDto {
  @ApiProperty({ type: CreateArticleDataDto })
  @ValidateNested()
  @Type(() => CreateArticleDataDto)
  @IsNotEmpty()
  article!: CreateArticleDataDto;
}
