import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file (JPG, PNG, WEBP, GIF, max 5MB)',
  })
  file!: any;
}
