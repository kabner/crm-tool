import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordAttachment } from '../entities/record-attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(RecordAttachment)
    private readonly attachmentRepository: Repository<RecordAttachment>,
  ) {}

  async findAll(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<RecordAttachment[]> {
    return this.attachmentRepository.find({
      where: { tenantId, entityType, entityId },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    tenantId: string,
    userId: string,
    data: {
      entityType: string;
      entityId: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      fileUrl: string;
    },
  ): Promise<RecordAttachment> {
    const attachment = this.attachmentRepository.create({
      tenantId,
      uploadedById: userId,
      ...data,
    });
    return this.attachmentRepository.save(attachment);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id, tenantId },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    await this.attachmentRepository.remove(attachment);
  }
}
