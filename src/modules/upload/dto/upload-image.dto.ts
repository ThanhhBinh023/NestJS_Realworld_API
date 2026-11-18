import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file to upload (JPEG, PNG, WEBP, GIF, max 5MB)',
  })
  file!: any;
}
