import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { Ticket } from '../entities/ticket.entity';
import { CreateChatSessionDto } from '../dto/create-chat-session.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async createSession(
    tenantId: string,
    dto: CreateChatSessionDto,
  ): Promise<ChatSession> {
    const session = this.sessionRepository.create({
      tenantId,
      contactId: dto.contactId ?? null,
      status: 'waiting',
      channel: 'web_chat',
      startedAt: new Date(),
      metadata: dto.metadata ?? {},
    });
    return this.sessionRepository.save(session);
  }

  async assignAgent(
    tenantId: string,
    sessionId: string,
    agentId: string,
  ): Promise<ChatSession> {
    const session = await this.findSession(tenantId, sessionId);

    if (session.status === 'ended') {
      throw new BadRequestException('Cannot assign agent to an ended session');
    }

    const isFirstResponse = !session.firstResponseAt;

    session.agentId = agentId;
    session.status = 'active';
    if (isFirstResponse) {
      session.firstResponseAt = new Date();
    }

    return this.sessionRepository.save(session);
  }

  async sendMessage(
    tenantId: string,
    sessionId: string,
    senderType: string,
    senderId: string | null,
    body: string,
  ): Promise<ChatMessage> {
    // Verify session exists and belongs to tenant
    await this.findSession(tenantId, sessionId);

    const message = this.messageRepository.create({
      sessionId,
      senderType,
      senderId,
      body,
    });

    return this.messageRepository.save(message);
  }

  async getMessages(
    tenantId: string,
    sessionId: string,
  ): Promise<ChatMessage[]> {
    // Verify session exists and belongs to tenant
    await this.findSession(tenantId, sessionId);

    return this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getActiveSessions(
    tenantId: string,
    agentId?: string,
  ): Promise<ChatSession[]> {
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.tenantId = :tenantId', { tenantId })
      .andWhere('session.status IN (:...statuses)', {
        statuses: ['active', 'waiting'],
      });

    if (agentId) {
      qb.andWhere(
        '(session.agentId = :agentId OR session.agentId IS NULL)',
        { agentId },
      );
    }

    qb.orderBy('session.startedAt', 'DESC');

    return qb.getMany();
  }

  async endSession(
    tenantId: string,
    sessionId: string,
  ): Promise<ChatSession> {
    const session = await this.findSession(tenantId, sessionId);
    session.status = 'ended';
    session.endedAt = new Date();
    return this.sessionRepository.save(session);
  }

  async convertToTicket(
    tenantId: string,
    sessionId: string,
    subject?: string,
  ): Promise<ChatSession> {
    const session = await this.findSession(tenantId, sessionId);

    if (session.ticketId) {
      throw new BadRequestException(
        'This chat session has already been converted to a ticket',
      );
    }

    // Generate a ticket number
    const ticketCount = await this.ticketRepository.count({
      where: { tenantId },
    });
    const ticketNumber = `TICK-${String(ticketCount + 1).padStart(5, '0')}`;

    const ticket = this.ticketRepository.create({
      tenantId,
      number: ticketNumber,
      subject: subject ?? `Chat conversation ${sessionId.slice(0, 8)}`,
      status: 'new',
      priority: 'normal',
      contactId: session.contactId ?? undefined,
      assignedTo: session.agentId ?? undefined,
      channel: 'chat',
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    session.ticketId = savedTicket.id;
    return this.sessionRepository.save(session);
  }

  private async findSession(
    tenantId: string,
    sessionId: string,
  ): Promise<ChatSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException(
        `Chat session with ID "${sessionId}" not found`,
      );
    }

    return session;
  }
}
