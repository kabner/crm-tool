import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateTemplateDto,
  ): Promise<EmailTemplate> {
    const template = this.templateRepo.create({
      tenantId,
      ...dto,
    });
    return this.templateRepo.save(template);
  }

  async findAll(tenantId: string) {
    return this.templateRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<EmailTemplate> {
    const template = await this.templateRepo.findOne({
      where: { id, tenantId },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.findOne(tenantId, id);
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const template = await this.findOne(tenantId, id);
    await this.templateRepo.remove(template);
  }
}
