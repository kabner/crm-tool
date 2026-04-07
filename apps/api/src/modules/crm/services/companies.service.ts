import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { ContactCompany } from '../entities/contact-company.entity';
import { UserFavorite } from '../entities/user-favorite.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyFilterDto } from '../dto/company-filter.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(ContactCompany)
    private readonly contactCompanyRepo: Repository<ContactCompany>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepo: Repository<UserFavorite>,
  ) {}

  async create(tenantId: string, dto: CreateCompanyDto, userId?: string): Promise<Company> {
    const company = this.companyRepo.create({
      ...dto,
      tenantId,
      createdById: userId,
    });
    return this.companyRepo.save(company);
  }

  async findAll(tenantId: string, filters: CompanyFilterDto, userId?: string) {
    const { page, limit, sort, order, search, industry, size, ownerId, createdAfter, createdBefore, lifecycleStage, favorite } = filters;

    // Total unfiltered count for this tenant
    const totalCount = await this.companyRepo.count({
      where: { tenantId },
    });

    const qb = this.companyRepo
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.createdBy', 'createdBy')
      .where('company.tenantId = :tenantId', { tenantId });

    if (search) {
      // Left join deals for search expansion (Task 8)
      qb.leftJoin('deals', 'deal', 'deal.company_id = company.id');
      qb.andWhere(
        '(company.name ILIKE :search OR company.domain ILIKE :search OR company.phone ILIKE :search OR deal.name ILIKE :search)',
        { search: `%${search}%` },
      );
      qb.distinct(true);
    }

    if (industry) {
      qb.andWhere('company.industry = :industry', { industry });
    }

    if (size) {
      qb.andWhere('company.size = :size', { size });
    }

    if (ownerId) {
      qb.andWhere('company.ownerId = :ownerId', { ownerId });
    }

    if (lifecycleStage) {
      qb.andWhere('company.lifecycleStage = :lifecycleStage', { lifecycleStage });
    }

    if (createdAfter) {
      qb.andWhere('company.createdAt >= :createdAfter', { createdAfter });
    }

    if (createdBefore) {
      qb.andWhere('company.createdAt <= :createdBefore', { createdBefore });
    }

    // Favorite filter
    if (favorite === 'true' && userId) {
      qb.innerJoin(
        UserFavorite,
        'fav',
        'fav.entityId = company.id AND fav.entityType = :favType AND fav.userId = :favUserId',
        { favType: 'company', favUserId: userId },
      );
    }

    const sortField = sort ? `company.${sort}` : 'company.createdAt';
    qb.orderBy(sortField, order);

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        total,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string): Promise<Company & { contactsCount: number }> {
    const company = await this.companyRepo
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.parent', 'parent')
      .leftJoinAndSelect('company.createdBy', 'createdBy')
      .where('company.id = :id', { id })
      .andWhere('company.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    const contactsCount = await this.contactCompanyRepo.count({
      where: { companyId: id },
    });

    return Object.assign(company, { contactsCount });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.findOne(tenantId, id);
    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const company = await this.findOne(tenantId, id);

    const associatedContacts = await this.contactCompanyRepo.count({
      where: { companyId: id },
    });

    if (associatedContacts > 0) {
      throw new BadRequestException(
        `Cannot delete company with ${associatedContacts} associated contact(s). Remove associations first.`,
      );
    }

    await this.companyRepo.remove(company);
  }

  async addContact(
    tenantId: string,
    companyId: string,
    contactId: string,
  ): Promise<ContactCompany> {
    await this.findOne(tenantId, companyId);

    const existing = await this.contactCompanyRepo.findOne({
      where: { contactId, companyId },
    });
    if (existing) {
      return existing;
    }

    const association = this.contactCompanyRepo.create({
      contactId,
      companyId,
    });
    return this.contactCompanyRepo.save(association);
  }

  async removeContact(
    tenantId: string,
    companyId: string,
    contactId: string,
  ): Promise<void> {
    await this.findOne(tenantId, companyId);
    await this.contactCompanyRepo.delete({ contactId, companyId });
  }

  async findByDomain(tenantId: string, domain: string): Promise<Company | null> {
    return this.companyRepo.findOne({
      where: { tenantId, domain },
    });
  }

  async findContacts(tenantId: string, companyId: string) {
    // Verify the company exists and belongs to this tenant
    await this.findOne(tenantId, companyId);

    const associations = await this.contactCompanyRepo.find({
      where: { companyId },
      relations: ['contact'],
    });

    return associations.map((assoc) => ({
      id: assoc.contact.id,
      firstName: assoc.contact.firstName,
      lastName: assoc.contact.lastName,
      email: assoc.contact.email,
      phone: assoc.contact.phone,
      jobTitle: assoc.contact.jobTitle,
      role: assoc.role,
      isPrimary: assoc.isPrimary,
    }));
  }
}
