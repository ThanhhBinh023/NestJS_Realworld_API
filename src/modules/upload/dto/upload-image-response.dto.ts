import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDataDto {
  @ApiProperty({
    example: '/uploads/images/image-1794812345678-123456789.png',
    description: 'Accessible static URL of the uploaded image',
  })
  url!: string;

  @ApiProperty({
    example: 'image-1794812345678-123456789.png',
    description: 'Stored filename on the server',
  })
  filename!: string;

  @ApiProperty({
    example: 'image/png',
    description: 'MIME type of the uploaded file',
  })
  mimetype!: string;

  @ApiProperty({
    example: 102400,
    description: 'Size of the uploaded file in bytes',
  })
  size!: number;
}

export class UploadImageResponseDto {
  @ApiProperty({ type: UploadImageDataDto })
  image!: UploadImageDataDto;
}
