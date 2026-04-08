import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactTypeOption } from '../entities/contact-type-option.entity';

@Injectable()
export class ContactTypesService {
  constructor(
    @InjectRepository(ContactTypeOption)
    private readonly repo: Repository<ContactTypeOption>,
  ) {}

  async findAll(tenantId: string): Promise<ContactTypeOption[]> {
    return this.repo.find({
      where: { tenantId },
      order: { position: 'ASC' },
    });
  }

  async create(
    tenantId: string,
    dto: { name: string; color?: string },
  ): Promise<ContactTypeOption> {
    const maxResult = await this.repo
      .createQueryBuilder('cto')
      .select('MAX(cto.position)', 'max')
      .where('cto.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const position = (maxResult?.max ?? -1) + 1;

    const option = this.repo.create({
      tenantId,
      name: dto.name,
      color: dto.color ?? 'gray',
      position,
    });

    return this.repo.save(option);
  }

  async update(
    tenantId: string,
    id: string,
    dto: { name?: string; color?: string; position?: number },
  ): Promise<ContactTypeOption> {
    const option = await this.repo.findOne({ where: { id, tenantId } });
    if (!option) {
      throw new NotFoundException(`Contact type option "${id}" not found`);
    }

    if (dto.name !== undefined) option.name = dto.name;
    if (dto.color !== undefined) option.color = dto.color;
    if (dto.position !== undefined) option.position = dto.position;

    return this.repo.save(option);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const option = await this.repo.findOne({ where: { id, tenantId } });
    if (!option) {
      throw new NotFoundException(`Contact type option "${id}" not found`);
    }
    await this.repo.remove(option);
  }
}
