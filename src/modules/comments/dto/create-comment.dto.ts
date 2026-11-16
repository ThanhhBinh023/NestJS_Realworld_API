import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateCommentDataDto {
  @ApiProperty({
    example: 'His name was my name too.',
    description: 'The content of the comment',
  })
  @IsNotEmpty({ message: 'body must not be empty' })
  @IsString({ message: 'body must be a string' })
  body!: string;
}

export class CreateCommentDto {
  @ApiProperty({ type: CreateCommentDataDto })
  @ValidateNested()
  @Type(() => CreateCommentDataDto)
  @IsNotEmpty()
  comment!: CreateCommentDataDto;
}
