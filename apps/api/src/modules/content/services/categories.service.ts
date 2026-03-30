import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentCategory } from '../entities/content-category.entity';
import { CreateContentCategoryDto } from '../dto/create-content-category.dto';
import { UpdateContentCategoryDto } from '../dto/update-content-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ContentCategory)
    private readonly categoryRepo: Repository<ContentCategory>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateContentCategoryDto,
  ): Promise<ContentCategory> {
    const slug = dto.slug || this.generateSlug(dto.name);

    const category = this.categoryRepo.create({
      tenantId,
      name: dto.name,
      slug,
      type: dto.type,
      description: dto.description ?? null,
      parentId: dto.parentId ?? null,
    });

    return this.categoryRepo.save(category);
  }

  async findAll(tenantId: string, type?: string) {
    const where: Record<string, any> = { tenantId };
    if (type) where.type = type;

    return this.categoryRepo.find({
      where,
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<ContentCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateContentCategoryDto,
  ): Promise<ContentCategory> {
    const category = await this.findOne(tenantId, id);

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.slug !== undefined) category.slug = dto.slug;
    if (dto.type !== undefined) category.type = dto.type;
    if (dto.description !== undefined) category.description = dto.description ?? null;
    if (dto.parentId !== undefined) category.parentId = dto.parentId ?? null;

    return this.categoryRepo.save(category);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const category = await this.findOne(tenantId, id);
    await this.categoryRepo.remove(category);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
