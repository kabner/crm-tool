import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineField } from '../entities/pipeline-field.entity';

@Injectable()
export class PipelineFieldsService {
  constructor(
    @InjectRepository(PipelineField)
    private readonly repo: Repository<PipelineField>,
  ) {}

  async findByPipeline(tenantId: string, pipelineId: string): Promise<PipelineField[]> {
    return this.repo.find({
      where: { tenantId, pipelineId },
      order: { position: 'ASC' },
    });
  }

  async create(
    tenantId: string,
    pipelineId: string,
    data: {
      name: string;
      fieldKey?: string;
      fieldType?: string;
      options?: string[];
      required?: boolean;
    },
  ): Promise<PipelineField> {
    const fieldKey =
      data.fieldKey ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');

    // Get max position
    const maxResult = await this.repo
      .createQueryBuilder('pf')
      .select('MAX(pf.position)', 'maxPos')
      .where('pf.tenantId = :tenantId', { tenantId })
      .andWhere('pf.pipelineId = :pipelineId', { pipelineId })
      .getRawOne();

    const position = (maxResult?.maxPos ?? -1) + 1;

    const field = this.repo.create({
      tenantId,
      pipelineId,
      name: data.name,
      fieldKey,
      fieldType: data.fieldType ?? 'text',
      options: data.options ?? null,
      required: data.required ?? false,
      position,
    });

    return this.repo.save(field);
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      fieldType: string;
      options: string[] | null;
      required: boolean;
      position: number;
    }>,
  ): Promise<PipelineField> {
    const field = await this.repo.findOne({ where: { id, tenantId } });
    if (!field) {
      throw new NotFoundException(`Pipeline field with ID "${id}" not found`);
    }
    Object.assign(field, data);
    return this.repo.save(field);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const field = await this.repo.findOne({ where: { id, tenantId } });
    if (!field) {
      throw new NotFoundException(`Pipeline field with ID "${id}" not found`);
    }
    await this.repo.remove(field);
  }
}
