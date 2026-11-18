import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service.js';

describe('UploadService', () => {
  const uploadService = new UploadService();

  describe('uploadImage', () => {
    it('should throw BadRequestException if file is undefined', async () => {
      await expect(uploadService.uploadImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return image metadata with static url', async () => {
      const mockFile = {
        filename: 'image-12345.png',
        mimetype: 'image/png',
        size: 50000,
      } as Express.Multer.File;

      const result = await uploadService.uploadImage(mockFile);

      expect(result.image.url).toBe('/uploads/images/image-12345.png');
      expect(result.image.filename).toBe('image-12345.png');
      expect(result.image.mimetype).toBe('image/png');
      expect(result.image.size).toBe(50000);
    });
  });
});
