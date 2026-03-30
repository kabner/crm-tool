import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../entities/deal.entity';
import { DealStage } from '../entities/deal-stage.entity';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { DealFilterDto } from '../dto/deal-filter.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(DealStage)
    private readonly dealStageRepository: Repository<DealStage>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateDealDto,
  ): Promise<Deal> {
    const { contactIds, ...dealData } = dto;

    const deal = this.dealRepository.create({
      ...dealData,
      tenantId,
      ownerId: dealData.ownerId ?? userId,
    });

    const savedDeal = await this.dealRepository.save(deal);
    return this.findOne(tenantId, savedDeal.id);
  }

  async findAll(
    tenantId: string,
    filters: DealFilterDto,
  ): Promise<{
    data: Deal[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      sort,
      order = 'DESC',
      search,
      pipelineId,
      stageId,
      ownerId,
      companyId,
      minAmount,
      maxAmount,
      closeDateAfter,
      closeDateBefore,
      won,
    } = filters;

    const qb = this.dealRepository
      .createQueryBuilder('deal')
      .leftJoinAndSelect('deal.stage', 'stage')
      .leftJoinAndSelect('deal.pipeline', 'pipeline')
      .where('deal.tenantId = :tenantId', { tenantId });

    if (search) {
      qb.andWhere('deal.name ILIKE :search', { search: `%${search}%` });
    }

    if (pipelineId) {
      qb.andWhere('deal.pipelineId = :pipelineId', { pipelineId });
    }

    if (stageId) {
      qb.andWhere('deal.stageId = :stageId', { stageId });
    }

    if (ownerId) {
      qb.andWhere('deal.ownerId = :ownerId', { ownerId });
    }

    if (companyId) {
      qb.andWhere('deal.companyId = :companyId', { companyId });
    }

    if (minAmount !== undefined) {
      qb.andWhere('deal.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      qb.andWhere('deal.amount <= :maxAmount', { maxAmount });
    }

    if (closeDateAfter) {
      qb.andWhere('deal.closeDate >= :closeDateAfter', { closeDateAfter });
    }

    if (closeDateBefore) {
      qb.andWhere('deal.closeDate <= :closeDateBefore', { closeDateBefore });
    }

    if (won !== undefined) {
      const wonBool = won === 'true';
      qb.andWhere('deal.won = :won', { won: wonBool });
    }

    const sortField = sort ? `deal.${sort}` : 'deal.createdAt';
    qb.orderBy(sortField, order);

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id, tenantId },
      relations: ['stage', 'pipeline', 'company', 'owner'],
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    return deal;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDealDto,
  ): Promise<Deal> {
    const deal = await this.findOne(tenantId, id);

    const { contactIds, ...updateData } = dto;

    // If stageId is changing, check the new stage type and auto-set won field
    if (updateData.stageId && updateData.stageId !== deal.stageId) {
      const newStage = await this.dealStageRepository.findOne({
        where: { id: updateData.stageId },
      });
      if (newStage) {
        if (newStage.stageType === 'won') {
          updateData.won = true;
        } else if (newStage.stageType === 'lost') {
          updateData.won = false;
        }
      }
    }

    Object.assign(deal, updateData);
    await this.dealRepository.save(deal);

    return this.findOne(tenantId, id);
  }

  async moveStage(
    tenantId: string,
    id: string,
    stageId: string,
    position?: number,
  ): Promise<Deal> {
    const deal = await this.findOne(tenantId, id);

    const newStage = await this.dealStageRepository.findOne({
      where: { id: stageId },
    });

    if (!newStage) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found`);
    }

    let wonValue: boolean | null = null;
    if (newStage.stageType === 'won') {
      wonValue = true;
    } else if (newStage.stageType === 'lost') {
      wonValue = false;
    }

    const updateFields: Record<string, unknown> = {
      stageId,
      won: wonValue,
    };

    if (position !== undefined) {
      updateFields.position = position;
    }

    await this.dealRepository.update(
      { id: deal.id, tenantId },
      updateFields,
    );

    // Reorder other deals in the target stage to make room
    if (position !== undefined) {
      await this.reorderDealsInStage(tenantId, stageId, id, position);
    }

    return this.findOne(tenantId, id);
  }

  async reorderDealsInStage(
    tenantId: string,
    stageId: string,
    movedDealId: string,
    targetPosition: number,
  ): Promise<void> {
    // Get all deals in this stage ordered by position, excluding the moved deal
    const deals = await this.dealRepository.find({
      where: { tenantId, stageId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    // Build new order: insert the moved deal at targetPosition
    const others = deals.filter((d) => d.id !== movedDealId);
    const moved = deals.find((d) => d.id === movedDealId);
    if (!moved) return;

    others.splice(targetPosition, 0, moved);

    // Update positions
    const updates = others.map((deal, idx) => ({
      id: deal.id,
      position: idx,
    }));

    for (const u of updates) {
      await this.dealRepository.update(u.id, { position: u.position });
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const deal = await this.findOne(tenantId, id);
    await this.dealRepository.remove(deal);
  }

  async getByPipeline(
    tenantId: string,
    pipelineId: string,
  ): Promise<{
    stages: Array<{
      id: string;
      name: string;
      position: number;
      probability: number;
      stageType: string;
      deals: Deal[];
    }>;
  }> {
    const stages = await this.dealStageRepository.find({
      where: { pipelineId },
      order: { position: 'ASC' },
    });

    const deals = await this.dealRepository.find({
      where: { tenantId, pipelineId },
      relations: ['company', 'owner'],
      order: { position: 'ASC', createdAt: 'DESC' },
    });

    const dealsByStage = new Map<string, Deal[]>();
    for (const deal of deals) {
      const existing = dealsByStage.get(deal.stageId) ?? [];
      existing.push(deal);
      dealsByStage.set(deal.stageId, existing);
    }

    return {
      stages: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        position: stage.position,
        probability: stage.probability,
        stageType: stage.stageType,
        deals: dealsByStage.get(stage.id) ?? [],
      })),
    };
  }

  async getSummary(
    tenantId: string,
    pipelineId: string,
  ): Promise<{
    totalValue: number;
    weightedValue: number;
    stages: Array<{
      id: string;
      name: string;
      position: number;
      probability: number;
      stageType: string;
      dealCount: number;
      totalValue: number;
      weightedValue: number;
    }>;
  }> {
    const stages = await this.dealStageRepository.find({
      where: { pipelineId },
      order: { position: 'ASC' },
    });

    const results = await this.dealRepository
      .createQueryBuilder('deal')
      .select('deal.stageId', 'stageId')
      .addSelect('COUNT(deal.id)', 'dealCount')
      .addSelect('COALESCE(SUM(deal.amount), 0)', 'totalValue')
      .where('deal.tenantId = :tenantId', { tenantId })
      .andWhere('deal.pipelineId = :pipelineId', { pipelineId })
      .groupBy('deal.stageId')
      .getRawMany();

    const resultMap = new Map(
      results.map((r) => [
        r.stageId,
        {
          dealCount: parseInt(r.dealCount, 10),
          totalValue: parseFloat(r.totalValue),
        },
      ]),
    );

    let totalValue = 0;
    let weightedValue = 0;

    const stagesSummary = stages.map((stage) => {
      const data = resultMap.get(stage.id) ?? {
        dealCount: 0,
        totalValue: 0,
      };
      const stageWeightedValue =
        data.totalValue * (Number(stage.probability) / 100);

      totalValue += data.totalValue;
      weightedValue += stageWeightedValue;

      return {
        id: stage.id,
        name: stage.name,
        position: stage.position,
        probability: Number(stage.probability),
        stageType: stage.stageType,
        dealCount: data.dealCount,
        totalValue: data.totalValue,
        weightedValue: stageWeightedValue,
      };
    });

    return {
      totalValue,
      weightedValue,
      stages: stagesSummary,
    };
  }
}
