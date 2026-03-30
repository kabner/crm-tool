import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MarketingEmail } from '../entities/marketing-email.entity';
import { EmailSend } from '../entities/email-send.entity';
import { Contact } from '../../crm/entities/contact.entity';
import { ListMembership } from '../../crm/entities/list-membership.entity';
import { CreateEmailDto } from '../dto/create-email.dto';
import { UpdateEmailDto } from '../dto/update-email.dto';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailDeliveryService } from './email-delivery.service';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(MarketingEmail)
    private readonly emailRepo: Repository<MarketingEmail>,
    @InjectRepository(EmailSend)
    private readonly emailSendRepo: Repository<EmailSend>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(ListMembership)
    private readonly listMembershipRepo: Repository<ListMembership>,
    private readonly deliveryService: EmailDeliveryService,
  ) {}

  async create(tenantId: string, dto: CreateEmailDto): Promise<MarketingEmail> {
    const email = this.emailRepo.create({
      tenantId,
      ...dto,
      subject: dto.subject || '',
      fromName: dto.fromName || '',
      fromEmail: dto.fromEmail || '',
      contentHtml: dto.contentHtml || '',
      sendType: dto.sendType || 'broadcast',
      status: 'draft',
      contentJson: dto.contentJson || {},
      statsCache: {},
    });
    return this.emailRepo.save(email);
  }

  async findAll(
    tenantId: string,
    filters: { status?: string; search?: string; limit?: number; page?: number },
  ) {
    const limit = filters.limit || 25;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const qb = this.emailRepo
      .createQueryBuilder('email')
      .where('email.tenantId = :tenantId', { tenantId });

    if (filters.status) {
      qb.andWhere('email.status = :status', { status: filters.status });
    }

    if (filters.search) {
      qb.andWhere('(email.name ILIKE :search OR email.subject ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('email.createdAt', 'DESC').skip(offset).take(limit);

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

  async findOne(tenantId: string, id: string): Promise<MarketingEmail> {
    const email = await this.emailRepo.findOne({
      where: { id, tenantId },
      relations: ['template'],
    });
    if (!email) {
      throw new NotFoundException('Email not found');
    }
    return email;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateEmailDto,
  ): Promise<MarketingEmail> {
    const email = await this.findOne(tenantId, id);
    if (!['draft', 'scheduled'].includes(email.status)) {
      throw new BadRequestException(
        'Can only update emails in draft or scheduled status',
      );
    }
    Object.assign(email, dto);
    return this.emailRepo.save(email);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const email = await this.findOne(tenantId, id);
    if (email.status !== 'draft') {
      throw new BadRequestException('Can only delete emails in draft status');
    }
    await this.emailRepo.remove(email);
  }

  async duplicate(tenantId: string, id: string): Promise<MarketingEmail> {
    const source = await this.findOne(tenantId, id);
    const clone = this.emailRepo.create({
      tenantId,
      name: `${source.name} (Copy)`,
      subject: source.subject,
      previewText: source.previewText,
      fromName: source.fromName,
      fromEmail: source.fromEmail,
      replyTo: source.replyTo,
      contentHtml: source.contentHtml,
      contentJson: source.contentJson,
      templateId: source.templateId,
      sendType: source.sendType,
      campaignId: source.campaignId,
      status: 'draft',
      statsCache: {},
    });
    return this.emailRepo.save(clone);
  }

  async send(
    tenantId: string,
    userId: string,
    dto: SendEmailDto,
  ): Promise<{ recipientCount: number }> {
    const email = await this.findOne(tenantId, dto.emailId);

    if (!['draft', 'scheduled'].includes(email.status)) {
      throw new BadRequestException('Email has already been sent or is sending');
    }

    // If scheduling for later, just update the status and scheduledAt
    if (dto.scheduledAt) {
      email.status = 'scheduled';
      email.scheduledAt = new Date(dto.scheduledAt);
      await this.emailRepo.save(email);
      return { recipientCount: 0 };
    }

    // Resolve recipients: combine contacts from lists and explicit contactIds
    const contactIdSet = new Set<string>();

    if (dto.contactIds?.length) {
      for (const cid of dto.contactIds) {
        contactIdSet.add(cid);
      }
    }

    if (dto.listIds?.length) {
      const memberships = await this.listMembershipRepo.find({
        where: { listId: In(dto.listIds) },
        select: ['contactId'],
      });
      for (const m of memberships) {
        contactIdSet.add(m.contactId);
      }
    }

    if (contactIdSet.size === 0) {
      throw new BadRequestException(
        'No recipients specified. Provide listIds or contactIds.',
      );
    }

    // Fetch contacts with emails, scoped to tenant
    const contactIds = Array.from(contactIdSet);
    const contacts = await this.contactRepo.find({
      where: { id: In(contactIds), tenantId },
    });

    const validContacts = contacts.filter((c) => c.email);

    if (validContacts.length === 0) {
      throw new BadRequestException(
        'No recipients have valid email addresses',
      );
    }

    // Update email status to sending
    email.status = 'sending';
    email.sentAt = new Date();
    await this.emailRepo.save(email);

    // Create EmailSend records and deliver
    const emailSends: EmailSend[] = [];
    for (const contact of validContacts) {
      const emailSend = this.emailSendRepo.create({
        tenantId,
        emailId: email.id,
        contactId: contact.id,
        status: 'queued',
      });
      emailSends.push(emailSend);
    }

    const savedSends = await this.emailSendRepo.save(emailSends);

    // Deliver emails (fire-and-forget for each, errors handled per-send)
    for (let i = 0; i < savedSends.length; i++) {
      const send = savedSends[i]!;
      const contact = validContacts[i]!;
      this.deliveryService
        .deliverEmail(send, email, contact)
        .catch(() => {
          // errors are handled inside deliverEmail (status set to bounced)
        });
    }

    // Update email status to sent
    email.status = 'sent';
    await this.emailRepo.save(email);

    return { recipientCount: validContacts.length };
  }

  async getStats(tenantId: string, emailId: string) {
    const email = await this.findOne(tenantId, emailId);

    const sends = await this.emailSendRepo.find({
      where: { emailId: email.id, tenantId },
    });

    const total = sends.length;
    const sent = sends.filter((s) => s.status === 'sent').length;
    const delivered = sends.filter((s) => s.deliveredAt).length;
    const opened = sends.filter((s) => s.openedAt).length;
    const clicked = sends.filter((s) => s.clickedAt).length;
    const bounced = sends.filter((s) => s.status === 'bounced').length;
    const unsubscribed = sends.filter((s) => s.unsubscribedAt).length;

    return {
      total,
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      rates: {
        delivered: total > 0 ? delivered / total : 0,
        opened: delivered > 0 ? opened / delivered : 0,
        clicked: delivered > 0 ? clicked / delivered : 0,
        bounced: total > 0 ? bounced / total : 0,
        unsubscribed: delivered > 0 ? unsubscribed / delivered : 0,
      },
    };
  }

  async trackOpen(emailSendId: string): Promise<void> {
    const send = await this.emailSendRepo.findOne({
      where: { id: emailSendId },
    });
    if (!send) return;

    send.openCount += 1;
    if (!send.openedAt) {
      send.openedAt = new Date();
    }
    await this.emailSendRepo.save(send);
  }

  async trackClick(emailSendId: string, url: string): Promise<void> {
    const send = await this.emailSendRepo.findOne({
      where: { id: emailSendId },
    });
    if (!send) return;

    send.clickCount += 1;
    if (!send.clickedAt) {
      send.clickedAt = new Date();
    }
    await this.emailSendRepo.save(send);
  }

  async processUnsubscribe(emailSendId: string): Promise<void> {
    const send = await this.emailSendRepo.findOne({
      where: { id: emailSendId },
    });
    if (!send) return;

    send.unsubscribedAt = new Date();
    send.status = 'unsubscribed';
    await this.emailSendRepo.save(send);

    // Update contact preferences
    const contact = await this.contactRepo.findOne({
      where: { id: send.contactId },
    });
    if (contact) {
      contact.customProps = {
        ...contact.customProps,
        emailOptOut: true,
        emailOptOutDate: new Date().toISOString(),
      };
      await this.contactRepo.save(contact);
    }
  }
}
