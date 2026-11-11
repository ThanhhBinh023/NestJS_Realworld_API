import { ApiProperty } from '@nestjs/swagger';

export class TagsResponseDto {
  @ApiProperty({
    example: ['dragons', 'training', 'nestjs'],
    description: 'Array of tag names',
  })
  tags!: string[];
}
