import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketCategory } from '../entities/ticket-category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(TicketCategory)
    private readonly categoryRepository: Repository<TicketCategory>,
  ) {}

  async create(
    tenantId: string,
    dto: CreateCategoryDto,
  ): Promise<TicketCategory> {
    const category = this.categoryRepository.create({
      tenantId,
      name: dto.name,
      parentId: dto.parentId ?? null,
      description: dto.description ?? null,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(tenantId: string): Promise<TicketCategory[]> {
    return this.categoryRepository.find({
      where: { tenantId },
      relations: ['parent'],
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<TicketCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
      relations: ['parent'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return category;
  }

  async update(
    tenantId: string,
    id: string,
    dto: Partial<CreateCategoryDto>,
  ): Promise<TicketCategory> {
    const category = await this.findOne(tenantId, id);
    Object.assign(category, dto);
    await this.categoryRepository.save(category);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const category = await this.findOne(tenantId, id);
    await this.categoryRepository.remove(category);
  }
}
