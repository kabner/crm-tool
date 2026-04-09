import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pipeline } from '../entities/pipeline.entity';
import { DealStage } from '../entities/deal-stage.entity';
import { Deal } from '../entities/deal.entity';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { UpdatePipelineDto } from '../dto/update-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline)
    private readonly pipelineRepository: Repository<Pipeline>,
    @InjectRepository(DealStage)
    private readonly dealStageRepository: Repository<DealStage>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
  ) {}

  async findAll(tenantId: string, type?: string): Promise<Pipeline[]> {
    const qb = this.pipelineRepository
      .createQueryBuilder('pipeline')
      .loadRelationCountAndMap('pipeline.stageCount', 'pipeline.stages')
      .where('pipeline.tenantId = :tenantId', { tenantId });

    if (type) {
      qb.andWhere('pipeline.type = :type', { type });
    }

    const pipelines = await qb
      .orderBy('pipeline.createdAt', 'ASC')
      .getMany();

    return pipelines;
  }

  async findOne(tenantId: string, id: string): Promise<Pipeline> {
    const pipeline = await this.pipelineRepository.findOne({
      where: { id, tenantId },
      relations: ['stages'],
      order: { stages: { position: 'ASC' } },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${id}" not found`);
    }

    return pipeline;
  }

  async create(tenantId: string, dto: CreatePipelineDto): Promise<Pipeline> {
    const { stages: stagesDto, ...pipelineData } = dto;

    // If this is set as default, unset other defaults
    if (pipelineData.isDefault) {
      await this.pipelineRepository.update(
        { tenantId, isDefault: true },
        { isDefault: false },
      );
    }

    const pipeline = this.pipelineRepository.create({
      ...pipelineData,
      tenantId,
    });

    const savedPipeline = await this.pipelineRepository.save(pipeline);

    if (stagesDto?.length) {
      const stages = stagesDto.map((s) =>
        this.dealStageRepository.create({
          ...s,
          pipelineId: savedPipeline.id,
        }),
      );
      await this.dealStageRepository.save(stages);
    }

    return this.findOne(tenantId, savedPipeline.id);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePipelineDto,
  ): Promise<Pipeline> {
    const pipeline = await this.findOne(tenantId, id);

    const { stages: stagesDto, ...pipelineData } = dto;

    // If setting as default, unset other defaults
    if (pipelineData.isDefault) {
      await this.pipelineRepository.update(
        { tenantId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(pipeline, pipelineData);
    await this.pipelineRepository.save(pipeline);

    if (stagesDto !== undefined) {
      // Remove existing stages and replace with new ones
      await this.dealStageRepository.delete({ pipelineId: id });

      if (stagesDto.length) {
        const stages = stagesDto.map((s) =>
          this.dealStageRepository.create({
            ...s,
            pipelineId: id,
          }),
        );
        await this.dealStageRepository.save(stages);
      }
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const pipeline = await this.findOne(tenantId, id);

    // Check if there are deals in this pipeline
    const dealCount = await this.dealRepository.count({
      where: { pipelineId: id, tenantId },
    });

    if (dealCount > 0) {
      throw new ConflictException(
        `Cannot delete pipeline "${pipeline.name}" because it contains ${dealCount} deal(s). Move or delete the deals first.`,
      );
    }

    // Remove stages first, then pipeline
    await this.dealStageRepository.delete({ pipelineId: id });
    await this.pipelineRepository.remove(pipeline);
  }

  async getDefault(tenantId: string): Promise<Pipeline> {
    const pipeline = await this.pipelineRepository.findOne({
      where: { tenantId, isDefault: true },
      relations: ['stages'],
      order: { stages: { position: 'ASC' } },
    });

    if (!pipeline) {
      throw new NotFoundException('No default pipeline configured');
    }

    return pipeline;
  }
}
