import { ApiProperty } from '@nestjs/swagger';

export class HelloResponseDto {
  @ApiProperty({
    example: 'Hello World!',
    description: 'Greeting message translated via i18n',
  })
  message!: string;

  @ApiProperty({
    example: 'Welcome to Conduit RealWorld API!',
    description: 'Welcome subtitle translated via i18n',
  })
  welcome!: string;

  @ApiProperty({
    example: 'en',
    description: 'Resolved language code (e.g. en, vi)',
  })
  lang!: string;

  @ApiProperty({
    example: '2026-11-04T04:30:00.000Z',
    description: 'ISO 8601 timestamp of the response',
  })
  timestamp!: string;
}
