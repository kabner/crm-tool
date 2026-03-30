import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { ContactCompany } from '../entities/contact-company.entity';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactFilterDto } from '../dto/contact-filter.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(ContactCompany)
    private readonly contactCompanyRepository: Repository<ContactCompany>,
  ) {}

  async create(tenantId: string, dto: CreateContactDto): Promise<Contact> {
    const { companyIds, ...contactData } = dto;

    const contact = this.contactRepository.create({
      ...contactData,
      tenantId,
    });

    const savedContact = await this.contactRepository.save(contact);

    if (companyIds?.length) {
      const associations = companyIds.map((companyId, index) =>
        this.contactCompanyRepository.create({
          contactId: savedContact.id,
          companyId,
          isPrimary: index === 0,
        }),
      );
      await this.contactCompanyRepository.save(associations);
    }

    return this.findOne(tenantId, savedContact.id);
  }

  async findAll(
    tenantId: string,
    filters: ContactFilterDto,
  ): Promise<{
    data: Contact[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      sort,
      order = 'DESC',
      search,
      lifecycleStage,
      leadStatus,
      ownerId,
      tags,
      companyId,
      createdAfter,
      createdBefore,
    } = filters;

    const qb = this.contactRepository
      .createQueryBuilder('contact')
      .where('contact.tenantId = :tenantId', { tenantId });

    // Full-text search across name and email
    if (search) {
      qb.andWhere(
        '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (lifecycleStage) {
      qb.andWhere('contact.lifecycleStage = :lifecycleStage', {
        lifecycleStage,
      });
    }

    if (leadStatus) {
      qb.andWhere('contact.leadStatus = :leadStatus', { leadStatus });
    }

    if (ownerId) {
      qb.andWhere('contact.ownerId = :ownerId', { ownerId });
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim());
      qb.andWhere('contact.tags && :tags', { tags: tagList });
    }

    if (companyId) {
      qb.innerJoin(
        ContactCompany,
        'cc',
        'cc.contactId = contact.id AND cc.companyId = :companyId',
        { companyId },
      );
    }

    if (createdAfter) {
      qb.andWhere('contact.createdAt >= :createdAfter', { createdAfter });
    }

    if (createdBefore) {
      qb.andWhere('contact.createdAt <= :createdBefore', { createdBefore });
    }

    // Sorting
    const sortField = sort ? `contact.${sort}` : 'contact.createdAt';
    qb.orderBy(sortField, order);

    // Pagination
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

  async findOne(tenantId: string, id: string): Promise<Contact> {
    const contact = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndMapMany(
        'contact.companies',
        ContactCompany,
        'cc',
        'cc.contactId = contact.id',
      )
      .where('contact.id = :id', { id })
      .andWhere('contact.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    return contact;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateContactDto,
  ): Promise<Contact> {
    const contact = await this.findOne(tenantId, id);

    const { companyIds, ...updateData } = dto;

    Object.assign(contact, updateData);
    await this.contactRepository.save(contact);

    if (companyIds !== undefined) {
      // Remove existing associations
      await this.contactCompanyRepository.delete({ contactId: id });

      // Create new associations
      if (companyIds.length) {
        const associations = companyIds.map((companyId, index) =>
          this.contactCompanyRepository.create({
            contactId: id,
            companyId,
            isPrimary: index === 0,
          }),
        );
        await this.contactCompanyRepository.save(associations);
      }
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const contact = await this.findOne(tenantId, id);
    await this.contactCompanyRepository.delete({ contactId: contact.id });
    await this.contactRepository.remove(contact);
  }

  async bulkUpdate(
    tenantId: string,
    ids: string[],
    dto: Partial<UpdateContactDto>,
  ): Promise<number> {
    const { companyIds, ...updateData } = dto;

    const result = await this.contactRepository
      .createQueryBuilder()
      .update(Contact)
      .set(updateData)
      .where('id IN (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId })
      .execute();

    return result.affected ?? 0;
  }

  async bulkDelete(tenantId: string, ids: string[]): Promise<number> {
    // Remove company associations first
    await this.contactCompanyRepository
      .createQueryBuilder()
      .delete()
      .where('contactId IN (:...ids)', { ids })
      .execute();

    const result = await this.contactRepository
      .createQueryBuilder()
      .delete()
      .where('id IN (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId })
      .execute();

    return result.affected ?? 0;
  }
}
