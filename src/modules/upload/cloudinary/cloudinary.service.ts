import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinaryType,
} from 'cloudinary';
import { Readable } from 'node:stream';
import { CLOUDINARY } from './cloudinary.provider.js';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    @Inject(CLOUDINARY)
    private readonly cloudinary: typeof cloudinaryType,
    private readonly configService: ConfigService,
  ) {}

  isConfigured(): boolean {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    return Boolean(cloudName && apiKey && apiSecret);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = 'realworld',
  ): Promise<UploadApiResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'Cloudinary is not configured. Missing credentials in environment variables.',
      );
    }

    if (file.path) {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        this.cloudinary.uploader.upload(
          file.path,
          {
            folder,
            resource_type: 'image',
          },
          (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
            if (error) {
              this.logger.error('Failed to upload file to Cloudinary', error);
              return reject(error);
            }
            if (!result) {
              return reject(new Error('Empty response from Cloudinary'));
            }
            resolve(result);
          },
        );
      });
    }

    // Fallback if file was stored in memory buffer
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error) {
            this.logger.error('Failed to stream file to Cloudinary', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Empty response from Cloudinary'));
          }
          resolve(result);
        },
      );

      const readable = new Readable();
      readable.push(file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }
}
