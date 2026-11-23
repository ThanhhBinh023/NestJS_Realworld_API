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

  async deleteFile(fileUrl?: string | null): Promise<void> {
    if (!fileUrl) {
      return;
    }

    // 1. Local Disk file cleanup
    if (fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          this.logger.warn(`Failed to delete local file: ${filePath}`, error);
        }
      }
      return;
    }

    // 2. Cloudinary file cleanup
    if (
      this.cloudinaryService.isConfigured() &&
      fileUrl.includes('res.cloudinary.com')
    ) {
      try {
        const matches = fileUrl.match(
          /\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/,
        );
        if (matches && matches[1]) {
          await this.cloudinaryService.deleteFile(matches[1]);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to delete file from Cloudinary: ${fileUrl}`,
          error,
        );
      }
    }
  }
}
