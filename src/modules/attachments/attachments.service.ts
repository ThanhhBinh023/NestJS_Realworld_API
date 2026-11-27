import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity.js';

export interface AttachmentMetadata {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface CreateAttachmentInput extends AttachmentMetadata {
  attachableType: string;
  attachableId: string;
}

/**
 * Manages polymorphic file attachment records and local disk cleanup.
 */
@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  /** Creates a new polymorphic attachment record with a UUID primary key. */
  async create(input: CreateAttachmentInput): Promise<Attachment> {
    const attachment = this.attachmentRepository.create({
      attachableType: input.attachableType,
      attachableId: input.attachableId,
      url: input.url,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
    });
    return this.attachmentRepository.save(attachment);
  }

  /**
   * Replaces existing attachment records for a polymorphic owner
   * and deletes previous local files under /uploads/.
   */
  async replaceForOwner(
    attachableType: string,
    attachableId: string,
    metadata: AttachmentMetadata,
  ): Promise<Attachment> {
    const existing = await this.findByOwner(attachableType, attachableId);

    if (existing.length > 0) {
      for (const item of existing) {
        if (item.url !== metadata.url) {
          this.removeLocalFile(item.url);
        }
      }
      await this.attachmentRepository.remove(existing);
    }

    return this.create({
      attachableType,
      attachableId,
      ...metadata,
    });
  }

  /** Lists all attachment records belonging to a polymorphic owner. */
  async findByOwner(
    attachableType: string,
    attachableId: string,
  ): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { attachableType, attachableId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Finds an attachment record by its string UUID. */
  async findById(id: string): Promise<Attachment | null> {
    return this.attachmentRepository.findOne({ where: { id } });
  }

  private removeLocalFile(fileUrl: string): void {
    if (!fileUrl.startsWith('/uploads/')) {
      return;
    }
    const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        this.logger.warn(`Failed to delete local file: ${filePath}`, error);
      }
    }
  }
}
