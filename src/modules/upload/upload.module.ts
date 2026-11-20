import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';
import { CloudinaryProvider } from './cloudinary/cloudinary.provider.js';
import { CloudinaryService } from './cloudinary/cloudinary.service.js';

@Module({
  controllers: [UploadController],
  providers: [CloudinaryProvider, CloudinaryService, UploadService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}
