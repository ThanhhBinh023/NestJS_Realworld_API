import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadImageResponseDto } from './dto/upload-image-response.dto.js';

@Injectable()
export class UploadService {
  async uploadImage(
    file?: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException({
        errors: { file: ['Image file is required'] },
      });
    }

    const fileUrl = `/uploads/images/${file.filename}`;

    return {
      image: {
        url: fileUrl,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
      },
    };
  }
}
