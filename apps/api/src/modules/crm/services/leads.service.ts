import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../entities/lead.entity';
import { Contact } from '../entities/contact.entity';
import { Company } from '../entities/company.entity';
import { Deal } from '../entities/deal.entity';
import { ContactCompany } from '../entities/contact-company.entity';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadFilterDto } from '../dto/lead-filter.dto';
import { ConvertLeadDto } from '../dto/convert-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(ContactCompany)
    private readonly contactCompanyRepository: Repository<ContactCompany>,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepository.create({
      ...dto,
      tenantId,
      createdById: userId,
    });
    const saved = await this.leadRepository.save(lead);
    return this.findOne(tenantId, saved.id);
  }

  async findAll(
    tenantId: string,
    filters: LeadFilterDto,
  ): Promise<{
    data: Lead[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      sort,
      order = 'DESC',
      search,
      status,
      source,
      ownerId,
      createdAfter,
      createdBefore,
    } = filters;

    const qb = this.leadRepository
      .createQueryBuilder('lead')
      .leftJoin('lead.owner', 'owner')
      .addSelect(['owner.id', 'owner.firstName', 'owner.lastName'])
      .where('lead.tenantId = :tenantId', { tenantId });

    if (search) {
      const trimmed = search.trim();
      qb.andWhere(
        '(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search OR lead.companyName ILIKE :search)',
        { search: `%${trimmed}%` },
      );
    }

    if (status) {
      qb.andWhere('lead.status = :status', { status });
    }

    if (source) {
      qb.andWhere('lead.source = :source', { source });
    }

    if (ownerId) {
      qb.andWhere('lead.ownerId = :ownerId', { ownerId });
    }

    if (createdAfter) {
      qb.andWhere('lead.createdAt >= :createdAfter', { createdAfter });
    }

    if (createdBefore) {
      qb.andWhere('lead.createdAt <= :createdBefore', { createdBefore });
    }

    const sortField = sort ? `lead.${sort}` : 'lead.createdAt';
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

  async findOne(tenantId: string, id: string): Promise<Lead> {
    const lead = await this.leadRepository
      .createQueryBuilder('lead')
      .leftJoin('lead.owner', 'owner')
      .addSelect(['owner.id', 'owner.firstName', 'owner.lastName'])
      .leftJoin('lead.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.firstName', 'createdBy.lastName'])
      .leftJoinAndSelect('lead.convertedContact', 'convertedContact')
      .leftJoinAndSelect('lead.convertedDeal', 'convertedDeal')
      .where('lead.id = :id', { id })
      .andWhere('lead.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    return lead;
  }

  async update(tenantId: string, id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(tenantId, id);
    Object.assign(lead, dto);
    await this.leadRepository.save(lead);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const lead = await this.findOne(tenantId, id);
    await this.leadRepository.remove(lead);
  }

  async convert(
    tenantId: string,
    userId: string,
    id: string,
    dto: ConvertLeadDto,
  ): Promise<{ lead: Lead; contact: Contact; deal?: Deal }> {
    const lead = await this.findOne(tenantId, id);

    if (lead.convertedAt) {
      throw new BadRequestException('Lead has already been converted');
    }

    if (dto.createDeal) {
      if (!dto.pipelineId || !dto.stageId) {
        throw new BadRequestException(
          'pipelineId and stageId are required when createDeal is true',
        );
      }
    }

    // 1. Create Contact from lead data
    const contact = this.contactRepository.create({
      tenantId,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      jobTitle: lead.jobTitle,
      source: lead.source,
      createdById: userId,
    });

    // 2. Resolve company
    let companyId: string | undefined;

    if (dto.companyId) {
      companyId = dto.companyId;
      contact.companyId = companyId;
    } else if (lead.companyName) {
      // Find existing company by name or create one
      let company = await this.companyRepository.findOne({
        where: { tenantId, name: lead.companyName },
      });
      if (!company) {
        company = this.companyRepository.create({
          tenantId,
          name: lead.companyName,
        });
        company = await this.companyRepository.save(company);
      }
      companyId = company.id;
      contact.companyId = companyId;
    }

    const savedContact = await this.contactRepository.save(contact);

    // 3. Create ContactCompany association
    if (companyId) {
      const association = this.contactCompanyRepository.create({
        contactId: savedContact.id,
        companyId,
        isPrimary: true,
      });
      await this.contactCompanyRepository.save(association);
    }

    // 4. Optionally create a Deal
    let deal: Deal | undefined;
    if (dto.createDeal) {
      const dealName =
        dto.dealName || `${lead.firstName} ${lead.lastName}${lead.companyName ? ` - ${lead.companyName}` : ''}`;
      const newDeal = this.dealRepository.create({
        tenantId,
        name: dealName,
        pipelineId: dto.pipelineId!,
        stageId: dto.stageId!,
        ownerId: lead.ownerId ?? userId,
      } as Partial<Deal>);
      if (dto.dealAmount !== undefined) {
        newDeal.amount = dto.dealAmount;
      }
      if (companyId) {
        newDeal.companyId = companyId;
      }
      deal = await this.dealRepository.save(newDeal);
    }

    // 5. Mark lead as converted
    lead.status = 'converted';
    lead.convertedAt = new Date();
    lead.convertedContactId = savedContact.id;
    if (deal) {
      lead.convertedDealId = deal.id;
    }
    await this.leadRepository.save(lead);

    const updatedLead = await this.findOne(tenantId, id);

    return { lead: updatedLead, contact: savedContact, deal };
  }
}
