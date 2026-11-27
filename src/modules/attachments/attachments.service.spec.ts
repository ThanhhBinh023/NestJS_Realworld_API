import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AttachmentsService } from './attachments.service.js';
import { AttachableType } from './entities/attachment.entity.js';

describe('AttachmentsService', () => {
  let attachmentsService: AttachmentsService;
  let mockAttachmentRepository: any;

  beforeEach(() => {
    mockAttachmentRepository = {
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation((entity) => ({
        id: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...entity,
      })),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      remove: vi.fn().mockResolvedValue([]),
    };

    attachmentsService = new AttachmentsService(mockAttachmentRepository);
  });

  describe('create', () => {
    it('should create polymorphic attachment with UUID id and metadata', async () => {
      const saved = await attachmentsService.create({
        attachableType: AttachableType.USER,
        attachableId: '1',
        url: '/uploads/avatars/avatar-1.png',
        fileName: 'avatar-1.png',
        fileType: 'image/png',
        fileSize: 1024,
      });

      expect(saved.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(saved.attachableType).toBe('user');
      expect(saved.attachableId).toBe('1');
      expect(saved.url).toBe('/uploads/avatars/avatar-1.png');
      expect(saved.fileName).toBe('avatar-1.png');
      expect(saved.fileType).toBe('image/png');
      expect(saved.fileSize).toBe(1024);
    });
  });

  describe('replaceForOwner', () => {
    it('should delete old local files, remove old records, and save new attachment', async () => {
      const testDir = path.join(process.cwd(), 'uploads', 'avatars');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      const oldFile = path.join(testDir, 'old-attachment-test.png');
      fs.writeFileSync(oldFile, 'old');

      const existing = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          attachableType: AttachableType.USER,
          attachableId: '1',
          url: '/uploads/avatars/old-attachment-test.png',
          fileName: 'old-attachment-test.png',
          fileType: 'image/png',
          fileSize: 100,
        },
      ];
      mockAttachmentRepository.find.mockResolvedValueOnce(existing);

      const result = await attachmentsService.replaceForOwner(
        AttachableType.USER,
        '1',
        {
          url: '/uploads/avatars/new-avatar.png',
          fileName: 'new-avatar.png',
          fileType: 'image/png',
          fileSize: 2048,
        },
      );

      expect(fs.existsSync(oldFile)).toBe(false);
      expect(mockAttachmentRepository.remove).toHaveBeenCalledWith(existing);
      expect(result.fileName).toBe('new-avatar.png');
    });
  });

  describe('findById', () => {
    it('should query attachment by string uuid', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockAttachmentRepository.findOne.mockResolvedValueOnce({ id: uuid });

      const found = await attachmentsService.findById(uuid);

      expect(mockAttachmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: uuid },
      });
      expect(found?.id).toBe(uuid);
    });
  });
});
