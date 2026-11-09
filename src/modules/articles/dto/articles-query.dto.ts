import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ArticlesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter articles by tag name',
    example: 'dragons',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Filter articles by author username',
    example: 'binh',
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({
    description: 'Filter articles favorited by username',
    example: 'binh',
  })
  @IsOptional()
  @IsString()
  favorited?: string;

  @ApiPropertyOptional({
    description: 'Number of articles to return (default 20)',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of articles to skip for pagination (default 0)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
