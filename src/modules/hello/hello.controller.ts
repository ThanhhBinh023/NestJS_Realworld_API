import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { HelloService } from './hello.service.js';
import { HelloQueryDto } from './dto/hello-query.dto.js';
import { HelloResponseDto } from './dto/hello-response.dto.js';

@ApiTags('Hello')
@Controller('hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Get()
  @ApiOperation({
    summary: 'Get hello greeting message with i18n support',
    description:
      'Returns a localized greeting and welcome message based on the query param (?lang=vi), Accept-Language header, or default fallback (en).',
  })
  @ApiOkResponse({
    description: 'Localized greeting successfully retrieved',
    type: HelloResponseDto,
  })
  async getHello(
    @Query() query: HelloQueryDto,
    @I18n() i18n: I18nContext,
  ): Promise<HelloResponseDto> {
    return this.helloService.getGreeting(i18n, query.lang);
  }
}
