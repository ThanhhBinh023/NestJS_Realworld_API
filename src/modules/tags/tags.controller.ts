import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service.js';
import { TagsResponseDto } from './dto/tags-response.dto.js';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiOkResponse({
    description: 'List of all existing tags',
    type: TagsResponseDto,
  })
  async getTags(): Promise<TagsResponseDto> {
    const tags = await this.tagsService.findAll();
    return { tags };
  }
}
