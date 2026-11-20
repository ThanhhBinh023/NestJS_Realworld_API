import * as fs from 'node:fs';
import * as path from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UploadImageResponseDto } from './dto/upload-image-response.dto.js';
import { CloudinaryService } from './cloudinary/cloudinary.service.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadImage(
    file?: Express.Multer.File,
    folder = 'images',
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException({
        errors: { file: ['Image file is required'] },
      });
    }

    // 1. Cloudinary Storage Strategy
    if (this.cloudinaryService.isConfigured()) {
      try {
        const result = await this.cloudinaryService.uploadFile(
          file,
          `realworld/${folder}`,
        );

        // Clean up temporary local file if it was written by Multer disk storage
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        return {
          image: {
            url: result.secure_url,
            filename: result.public_id,
            mimetype: file.mimetype,
            size: result.bytes || file.size,
          },
        };
      } catch (error) {
        this.logger.warn(
          'Cloudinary upload failed, falling back to local disk storage',
          error,
        );
      }
    }

    // 2. Local Disk Storage Fallback Strategy
    const subfolder = file.destination
      ? path.basename(file.destination)
      : folder;
    const fileUrl = `/uploads/${subfolder}/${file.filename}`;

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
