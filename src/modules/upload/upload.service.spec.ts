import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service.js';

describe('UploadService', () => {
  const mockCloudinaryService: any = {
    isConfigured: vi.fn().mockReturnValue(false),
    uploadFile: vi.fn(),
  };

  const uploadService = new UploadService(mockCloudinaryService);

  describe('uploadImage', () => {
    it('should throw BadRequestException if file is undefined', async () => {
      await expect(uploadService.uploadImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return image metadata with static url on local storage fallback', async () => {
      mockCloudinaryService.isConfigured.mockReturnValueOnce(false);

      const mockFile = {
        filename: 'image-12345.png',
        destination: 'uploads/images',
        mimetype: 'image/png',
        size: 50000,
      } as Express.Multer.File;

      const result = await uploadService.uploadImage(mockFile, 'images');

      expect(result.image.url).toBe('/uploads/images/image-12345.png');
      expect(result.image.filename).toBe('image-12345.png');
      expect(result.image.mimetype).toBe('image/png');
      expect(result.image.size).toBe(50000);
    });

    it('should upload to Cloudinary and return HTTPS CDN URL when Cloudinary is configured', async () => {
      mockCloudinaryService.isConfigured.mockReturnValueOnce(true);
      mockCloudinaryService.uploadFile.mockResolvedValueOnce({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        public_id: 'realworld/images/sample',
        bytes: 12345,
      });

      const mockFile = {
        filename: 'sample.jpg',
        mimetype: 'image/jpeg',
        size: 12345,
      } as Express.Multer.File;

      const result = await uploadService.uploadImage(mockFile, 'images');

      expect(result.image.url).toBe(
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      );
      expect(result.image.filename).toBe('realworld/images/sample');
      expect(mockCloudinaryService.uploadFile).toHaveBeenCalled();
    });
  });
});
