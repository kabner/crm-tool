import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketMacro } from '../entities/ticket-macro.entity';
import { Ticket } from '../entities/ticket.entity';
import { CreateMacroDto } from '../dto/create-macro.dto';

@Injectable()
export class MacrosService {
  constructor(
    @InjectRepository(TicketMacro)
    private readonly macroRepository: Repository<TicketMacro>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateMacroDto,
  ): Promise<TicketMacro> {
    const macro = this.macroRepository.create({
      tenantId,
      name: dto.name,
      actions: dto.actions,
      visibility: dto.visibility ?? 'personal',
      createdBy: userId,
    });
    return this.macroRepository.save(macro);
  }

  async findAll(tenantId: string): Promise<TicketMacro[]> {
    return this.macroRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<TicketMacro> {
    const macro = await this.macroRepository.findOne({
      where: { id, tenantId },
    });

    if (!macro) {
      throw new NotFoundException(`Macro with ID "${id}" not found`);
    }

    return macro;
  }

  async update(
    tenantId: string,
    id: string,
    dto: Partial<CreateMacroDto>,
  ): Promise<TicketMacro> {
    const macro = await this.findOne(tenantId, id);
    Object.assign(macro, dto);
    await this.macroRepository.save(macro);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const macro = await this.findOne(tenantId, id);
    await this.macroRepository.remove(macro);
  }

  async execute(
    tenantId: string,
    ticketId: string,
    macroId: string,
  ): Promise<Ticket> {
    const macro = await this.findOne(tenantId, macroId);
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId, tenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID "${ticketId}" not found`);
    }

    for (const action of macro.actions) {
      switch (action.type) {
        case 'set_status':
          ticket.status = action.value;
          if (action.value === 'resolved') ticket.resolvedAt = new Date();
          if (action.value === 'closed') ticket.closedAt = new Date();
          break;
        case 'set_priority':
          ticket.priority = action.value;
          break;
        case 'assign':
          ticket.assignedTo = action.value;
          break;
        case 'add_tag':
          if (!ticket.tags.includes(action.value)) {
            ticket.tags = [...ticket.tags, action.value];
          }
          break;
        case 'remove_tag':
          ticket.tags = ticket.tags.filter((t) => t !== action.value);
          break;
        case 'set_category':
          ticket.categoryId = action.value;
          break;
      }
    }

    await this.ticketRepository.save(ticket);

    // Increment usage count
    await this.macroRepository.increment({ id: macroId }, 'usageCount', 1);

    return ticket;
  }
}
