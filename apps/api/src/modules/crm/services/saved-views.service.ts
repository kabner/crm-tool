import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedView } from '../entities/saved-view.entity';
import { CreateSavedViewDto } from '../dto/create-saved-view.dto';
import { UpdateSavedViewDto } from '../dto/update-saved-view.dto';

@Injectable()
export class SavedViewsService {
  constructor(
    @InjectRepository(SavedView)
    private readonly viewRepository: Repository<SavedView>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateSavedViewDto,
  ): Promise<SavedView> {
    // If setting as default, unset previous default for same user+objectType
    if (dto.isDefault) {
      await this.unsetDefaults(tenantId, userId, dto.objectType);
    }

    const view = this.viewRepository.create({
      ...dto,
      tenantId,
      userId,
      viewType: dto.viewType ?? 'table',
    });

    return this.viewRepository.save(view);
  }

  async findAll(
    tenantId: string,
    userId: string,
    objectType: string,
  ): Promise<SavedView[]> {
    return this.viewRepository
      .createQueryBuilder('view')
      .where('view.tenantId = :tenantId', { tenantId })
      .andWhere('view.objectType = :objectType', { objectType })
      .andWhere(
        '(view.userId = :userId OR view.userId IS NULL)',
        { userId },
      )
      .orderBy('view.isDefault', 'DESC')
      .addOrderBy('view.name', 'ASC')
      .getMany();
  }

  async findOne(tenantId: string, id: string): Promise<SavedView> {
    const view = await this.viewRepository.findOne({
      where: { id, tenantId },
    });

    if (!view) {
      throw new NotFoundException(`Saved view with ID "${id}" not found`);
    }

    return view;
  }

  async update(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdateSavedViewDto,
  ): Promise<SavedView> {
    const view = await this.findOne(tenantId, id);

    // Only the owner can edit personal views; shared views (userId=null) can be edited by anyone
    if (view.userId && view.userId !== userId) {
      throw new ForbiddenException('You can only edit your own views');
    }

    // If setting as default, unset previous defaults
    if (dto.isDefault) {
      const objectType = dto.objectType ?? view.objectType;
      await this.unsetDefaults(tenantId, userId, objectType);
    }

    Object.assign(view, dto);
    return this.viewRepository.save(view);
  }

  async remove(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<void> {
    const view = await this.findOne(tenantId, id);

    if (view.userId && view.userId !== userId) {
      throw new ForbiddenException('You can only delete your own views');
    }

    await this.viewRepository.remove(view);
  }

  async setDefault(
    tenantId: string,
    userId: string,
    viewId: string,
    objectType: string,
  ): Promise<SavedView> {
    await this.unsetDefaults(tenantId, userId, objectType);

    const view = await this.findOne(tenantId, viewId);
    view.isDefault = true;
    return this.viewRepository.save(view);
  }

  private async unsetDefaults(
    tenantId: string,
    userId: string,
    objectType: string,
  ): Promise<void> {
    await this.viewRepository
      .createQueryBuilder()
      .update(SavedView)
      .set({ isDefault: false })
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('userId = :userId', { userId })
      .andWhere('objectType = :objectType', { objectType })
      .andWhere('isDefault = true')
      .execute();
  }
}
