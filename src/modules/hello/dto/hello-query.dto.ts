import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class HelloQueryDto {
  @ApiPropertyOptional({
    description: 'Language code preference for the response',
    enum: ['en', 'vi'],
    default: 'en',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'vi'])
  lang?: string;
}
