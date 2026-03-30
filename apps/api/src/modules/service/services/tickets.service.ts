import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketMessage } from '../entities/ticket-message.entity';
import { SLAPolicy } from '../entities/sla-policy.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketFilterDto } from '../dto/ticket-filter.dto';
import { CreateTicketMessageDto } from '../dto/create-ticket-message.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepository: Repository<TicketMessage>,
    @InjectRepository(SLAPolicy)
    private readonly slaRepository: Repository<SLAPolicy>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateTicketDto,
  ): Promise<Ticket> {
    // Generate sequential ticket number
    const lastTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.tenantId = :tenantId', { tenantId })
      .orderBy('ticket.createdAt', 'DESC')
      .getOne();

    let seq = 1;
    if (lastTicket?.number) {
      const match = lastTicket.number.match(/T-(\d+)/);
      if (match) {
        seq = parseInt(match[1]!, 10) + 1;
      }
    }

    const ticket = this.ticketRepository.create({
      tenantId,
      number: `T-${seq}`,
      subject: dto.subject,
      contactId: dto.contactId,
      priority: dto.priority ?? 'normal',
      categoryId: dto.categoryId ?? null,
      channel: dto.channel ?? 'email',
      assignedTo: dto.assignedTo ?? null,
      tags: dto.tags ?? [],
      status: 'new',
    });

    // Apply default SLA policy
    const defaultSla = await this.slaRepository.findOne({
      where: { tenantId, isDefault: true },
    });

    if (defaultSla) {
      ticket.slaPolicyId = defaultSla.id;
      const targets = defaultSla.targets as any;
      const now = new Date();
      if (targets?.firstResponseMinutes) {
        ticket.slaFirstResponseDue = new Date(
          now.getTime() + targets.firstResponseMinutes * 60000,
        );
      }
      if (targets?.resolutionMinutes) {
        ticket.slaResolutionDue = new Date(
          now.getTime() + targets.resolutionMinutes * 60000,
        );
      }
    }

    const savedTicket = await this.ticketRepository.save(ticket);

    // Create initial message if provided
    if (dto.initialMessage) {
      const message = this.messageRepository.create({
        ticketId: savedTicket.id,
        type: 'reply',
        direction: 'inbound',
        fromContact: true,
        userId: null,
        bodyHtml: dto.initialMessage,
      });
      await this.messageRepository.save(message);
    }

    return this.findOne(tenantId, savedTicket.id);
  }

  async findAll(
    tenantId: string,
    filters: TicketFilterDto,
  ): Promise<{
    data: Ticket[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      sort,
      order = 'DESC',
      status,
      priority,
      assignedTo,
      categoryId,
      contactId,
      search,
    } = filters;

    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.category', 'category')
      .where('ticket.tenantId = :tenantId', { tenantId });

    if (search) {
      qb.andWhere('ticket.subject ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      qb.andWhere('ticket.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('ticket.priority = :priority', { priority });
    }

    if (assignedTo) {
      qb.andWhere('ticket.assignedTo = :assignedTo', { assignedTo });
    }

    if (categoryId) {
      qb.andWhere('ticket.categoryId = :categoryId', { categoryId });
    }

    if (contactId) {
      qb.andWhere('ticket.contactId = :contactId', { contactId });
    }

    const sortField = sort ? `ticket.${sort}` : 'ticket.createdAt';
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

  async findOne(tenantId: string, id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.category', 'category')
      .where('ticket.id = :id', { id })
      .andWhere('ticket.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${id}" not found`);
    }

    // Load messages separately
    const messages = await this.messageRepository.find({
      where: { ticketId: id },
      order: { createdAt: 'ASC' },
    });

    (ticket as any).messages = messages;

    return ticket;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(tenantId, id);

    // If status changes to resolved, set resolvedAt
    if (dto.status === 'resolved' && ticket.status !== 'resolved') {
      (dto as any).resolvedAt = new Date();
    }

    // If status changes to closed, set closedAt
    if (dto.status === 'closed' && ticket.status !== 'closed') {
      (dto as any).closedAt = new Date();
    }

    Object.assign(ticket, dto);
    await this.ticketRepository.save(ticket);
    return this.findOne(tenantId, id);
  }

  async addMessage(
    tenantId: string,
    ticketId: string,
    userId: string,
    dto: CreateTicketMessageDto,
  ): Promise<TicketMessage> {
    const ticket = await this.findOne(tenantId, ticketId);

    const type = dto.type ?? 'reply';
    const direction =
      type === 'note' ? 'internal' : dto.direction ?? 'outbound';

    const message = this.messageRepository.create({
      ticketId,
      type,
      direction,
      fromContact: false,
      userId,
      bodyHtml: dto.bodyHtml,
    });

    const savedMessage = await this.messageRepository.save(message);

    // If first outbound reply, set firstResponseAt
    if (direction === 'outbound' && !ticket.firstResponseAt) {
      await this.ticketRepository.update(
        { id: ticketId },
        { firstResponseAt: new Date() },
      );
    }

    // If ticket is 'new', move to 'open' on first agent reply
    if (ticket.status === 'new' && direction === 'outbound') {
      await this.ticketRepository.update({ id: ticketId }, { status: 'open' });
    }

    return savedMessage;
  }

  async assign(
    tenantId: string,
    ticketId: string,
    userId: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(tenantId, ticketId);
    ticket.assignedTo = userId;
    if (ticket.status === 'new') {
      ticket.status = 'open';
    }
    await this.ticketRepository.save(ticket);
    return this.findOne(tenantId, ticketId);
  }

  async close(tenantId: string, ticketId: string): Promise<Ticket> {
    const ticket = await this.findOne(tenantId, ticketId);
    ticket.status = 'closed';
    ticket.closedAt = new Date();
    await this.ticketRepository.save(ticket);
    return this.findOne(tenantId, ticketId);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const ticket = await this.findOne(tenantId, id);
    await this.messageRepository.delete({ ticketId: ticket.id });
    await this.ticketRepository.remove(ticket);
  }

  async getStats(
    tenantId: string,
  ): Promise<{
    open: number;
    pending: number;
    resolved: number;
    avgResponseTime: number | null;
    avgResolutionTime: number | null;
  }> {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.tenantId = :tenantId', { tenantId });

    const [open, pending, resolved] = await Promise.all([
      qb.clone().andWhere("ticket.status IN ('new', 'open')").getCount(),
      qb.clone().andWhere("ticket.status = 'pending'").getCount(),
      qb.clone().andWhere("ticket.status = 'resolved'").getCount(),
    ]);

    // Average first response time (in minutes)
    const responseTimeResult = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ticket.first_response_at - ticket.created_at)) / 60)',
        'avg',
      )
      .where('ticket.tenantId = :tenantId', { tenantId })
      .andWhere('ticket.first_response_at IS NOT NULL')
      .getRawOne();

    // Average resolution time (in minutes)
    const resolutionTimeResult = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select(
        'AVG(EXTRACT(EPOCH FROM (ticket.resolved_at - ticket.created_at)) / 60)',
        'avg',
      )
      .where('ticket.tenantId = :tenantId', { tenantId })
      .andWhere('ticket.resolved_at IS NOT NULL')
      .getRawOne();

    return {
      open,
      pending,
      resolved,
      avgResponseTime: responseTimeResult?.avg
        ? Math.round(parseFloat(responseTimeResult.avg))
        : null,
      avgResolutionTime: resolutionTimeResult?.avg
        ? Math.round(parseFloat(resolutionTimeResult.avg))
        : null,
    };
  }
}
