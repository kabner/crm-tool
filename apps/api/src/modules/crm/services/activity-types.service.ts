import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityTypeOption } from '../entities/activity-type-option.entity';

@Injectable()
export class ActivityTypesService {
  constructor(
    @InjectRepository(ActivityTypeOption)
    private readonly repo: Repository<ActivityTypeOption>,
  ) {}

  async findAll(tenantId: string): Promise<ActivityTypeOption[]> {
    return this.repo.find({
      where: { tenantId },
      order: { position: 'ASC' },
    });
  }

  async create(
    tenantId: string,
    dto: { name: string; slug: string; icon?: string; color?: string; isInteraction?: boolean },
  ): Promise<ActivityTypeOption> {
    // Check slug uniqueness
    const existing = await this.repo.findOne({ where: { tenantId, slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Activity type with slug "${dto.slug}" already exists`);
    }

    const maxResult = await this.repo
      .createQueryBuilder('ato')
      .select('MAX(ato.position)', 'max')
      .where('ato.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const position = (maxResult?.max ?? -1) + 1;

    const option = this.repo.create({
      tenantId,
      name: dto.name,
      slug: dto.slug,
      icon: dto.icon ?? 'circle',
      color: dto.color ?? 'gray',
      isInteraction: dto.isInteraction ?? true,
      isSystem: false,
      position,
    });

    return this.repo.save(option);
  }

  async update(
    tenantId: string,
    id: string,
    dto: { name?: string; icon?: string; color?: string; isInteraction?: boolean; position?: number },
  ): Promise<ActivityTypeOption> {
    const option = await this.repo.findOne({ where: { id, tenantId } });
    if (!option) {
      throw new NotFoundException(`Activity type option "${id}" not found`);
    }

    if (dto.name !== undefined) option.name = dto.name;
    if (dto.icon !== undefined) option.icon = dto.icon;
    if (dto.color !== undefined) option.color = dto.color;
    if (dto.isInteraction !== undefined) option.isInteraction = dto.isInteraction;
    if (dto.position !== undefined) option.position = dto.position;

    return this.repo.save(option);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const option = await this.repo.findOne({ where: { id, tenantId } });
    if (!option) {
      throw new NotFoundException(`Activity type option "${id}" not found`);
    }
    if (option.isSystem) {
      throw new BadRequestException('Cannot delete system activity types');
    }
    await this.repo.remove(option);
  }
}
