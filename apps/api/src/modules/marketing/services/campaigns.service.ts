import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../entities/campaign.entity';
import { MarketingEmail } from '../entities/marketing-email.entity';
import { EmailSend } from '../entities/email-send.entity';
import { FormSubmission } from '../entities/form-submission.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(MarketingEmail)
    private readonly emailRepo: Repository<MarketingEmail>,
    @InjectRepository(EmailSend)
    private readonly emailSendRepo: Repository<EmailSend>,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async create(tenantId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepo.create({
      tenantId,
      name: dto.name,
      type: dto.type,
      status: 'draft',
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      budget: dto.budget ?? null,
      ownerId: dto.ownerId ?? null,
      settings: {},
    });
    return this.campaignRepo.save(campaign);
  }

  async findAll(
    tenantId: string,
    filters: { search?: string; status?: string; type?: string; limit?: number; page?: number },
  ) {
    const limit = filters.limit || 25;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const qb = this.campaignRepo
      .createQueryBuilder('campaign')
      .where('campaign.tenantId = :tenantId', { tenantId });

    if (filters.search) {
      qb.andWhere('campaign.name ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.status) {
      qb.andWhere('campaign.status = :status', { status: filters.status });
    }

    if (filters.type) {
      qb.andWhere('campaign.type = :type', { type: filters.type });
    }

    qb.orderBy('campaign.createdAt', 'DESC');

    const [data, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Attach asset counts per campaign
    const campaignsWithCounts = await Promise.all(
      data.map(async (campaign) => {
        const emailCount = await this.emailRepo.count({
          where: { campaignId: campaign.id },
        });
        return {
          ...campaign,
          assetCounts: { emails: emailCount },
        };
      }),
    );

    return {
      data: campaignsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({
      where: { id, tenantId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return campaign;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOne(tenantId, id);

    if (dto.name !== undefined) campaign.name = dto.name;
    if (dto.type !== undefined) campaign.type = dto.type;
    if (dto.status !== undefined) campaign.status = dto.status;
    if (dto.startDate !== undefined) campaign.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) campaign.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.budget !== undefined) campaign.budget = dto.budget ?? null;
    if (dto.ownerId !== undefined) campaign.ownerId = dto.ownerId ?? null;

    return this.campaignRepo.save(campaign);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const campaign = await this.findOne(tenantId, id);
    await this.campaignRepo.remove(campaign);
  }

  async getStats(tenantId: string, campaignId: string) {
    // Ensure campaign exists
    await this.findOne(tenantId, campaignId);

    // Count emails linked to campaign
    const emailIds = await this.emailRepo
      .createQueryBuilder('email')
      .select('email.id')
      .where('email.campaignId = :campaignId', { campaignId })
      .getMany();

    const emailIdList = emailIds.map((e) => e.id);

    let emailsSent = 0;
    let contactsReached = 0;
    if (emailIdList.length > 0) {
      // Count total sends
      emailsSent = await this.emailSendRepo
        .createQueryBuilder('send')
        .where('send.emailId IN (:...emailIdList)', { emailIdList })
        .getCount();

      // Count distinct contacts reached
      const contactsResult = await this.emailSendRepo
        .createQueryBuilder('send')
        .select('COUNT(DISTINCT send.contactId)', 'count')
        .where('send.emailId IN (:...emailIdList)', { emailIdList })
        .getRawOne();
      contactsReached = parseInt(contactsResult?.count || '0', 10);
    }

    // Placeholder: form submissions associated with campaign
    const formsSubmitted = 0;

    return {
      emailsSent,
      contactsReached,
      formsSubmitted,
      linkedEmails: emailIdList.length,
    };
  }
}
