import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceLineItem } from '../entities/invoice-line-item.entity';
import { TaxRate } from '../entities/tax-rate.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceLineItem)
    private readonly lineItemRepository: Repository<InvoiceLineItem>,
    @InjectRepository(TaxRate)
    private readonly taxRateRepository: Repository<TaxRate>,
  ) {}

  private async generateNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.number', 'DESC')
      .getOne();

    let nextNum = 1;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.number.replace(prefix, ''), 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  }

  async create(
    tenantId: string,
    dto: CreateInvoiceDto,
  ): Promise<Invoice & { lineItems: InvoiceLineItem[] }> {
    const { lineItems: lineItemDtos, ...invoiceData } = dto;

    const number = await this.generateNumber(tenantId);

    // Calculate totals from line items
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    // Pre-fetch tax rates if any line items reference them
    const taxRateIds = lineItemDtos
      .filter((li) => li.taxRateId)
      .map((li) => li.taxRateId!);

    const taxRates: Record<string, TaxRate> = {};
    if (taxRateIds.length) {
      const rates = await this.taxRateRepository
        .createQueryBuilder('tr')
        .where('tr.id IN (:...ids)', { ids: taxRateIds })
        .getMany();
      for (const rate of rates) {
        taxRates[rate.id] = rate;
      }
    }

    const computedItems = lineItemDtos.map((li, index) => {
      const lineSubtotal = li.quantity * li.unitPrice;
      const discount = li.discountPct
        ? Math.round(lineSubtotal * (li.discountPct / 100))
        : 0;
      const afterDiscount = lineSubtotal - discount;
      const tax = li.taxRateId && taxRates[li.taxRateId]
        ? Math.round(afterDiscount * (Number(taxRates[li.taxRateId]!.percentage) / 100))
        : 0;
      const total = afterDiscount + tax;

      subtotal += lineSubtotal;
      discountTotal += discount;
      taxTotal += tax;

      return {
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        productId: li.productId ?? undefined,
        discountPct: li.discountPct ?? undefined,
        taxRateId: li.taxRateId ?? undefined,
        total,
        position: index,
      };
    });

    const total = subtotal - discountTotal + taxTotal;

    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      tenantId,
      number,
      issueDate: new Date(),
      dueDate: new Date(dto.dueDate),
      status: 'draft',
      subtotal,
      discountTotal,
      taxTotal,
      total,
      amountPaid: 0,
      amountDue: total,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    const lineItems = computedItems.map((item) =>
      this.lineItemRepository.create({
        ...item,
        invoiceId: savedInvoice.id,
      }),
    );
    const savedLineItems = await this.lineItemRepository.save(lineItems);

    return { ...savedInvoice, lineItems: savedLineItems };
  }

  async findAll(
    tenantId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      contactId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    data: Invoice[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20, status, contactId, startDate, endDate } = filters;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId });

    if (status) {
      qb.andWhere('invoice.status = :status', { status });
    }

    if (contactId) {
      qb.andWhere('invoice.contactId = :contactId', { contactId });
    }

    if (startDate) {
      qb.andWhere('invoice.issueDate >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('invoice.issueDate <= :endDate', { endDate });
    }

    qb.orderBy('invoice.createdAt', 'DESC');

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

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<Invoice & { lineItems: InvoiceLineItem[] }> {
    const invoice = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndMapMany(
        'invoice.lineItems',
        InvoiceLineItem,
        'li',
        'li.invoiceId = invoice.id',
      )
      .where('invoice.id = :id', { id })
      .andWhere('invoice.tenantId = :tenantId', { tenantId })
      .addOrderBy('li.position', 'ASC')
      .getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${id}" not found`);
    }

    return invoice as Invoice & { lineItems: InvoiceLineItem[] };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateInvoiceDto,
  ): Promise<Invoice & { lineItems: InvoiceLineItem[] }> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be updated');
    }

    const { lineItems: lineItemDtos, ...updateData } = dto;

    if (updateData.dueDate) {
      (updateData as any).dueDate = new Date(updateData.dueDate);
    }

    Object.assign(invoice, updateData);
    await this.invoiceRepository.save(invoice);

    return this.findOne(tenantId, id);
  }

  async send(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    invoice.status = 'sent';
    invoice.sentAt = new Date();

    return this.invoiceRepository.save(invoice);
  }

  async markPaid(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status === 'void' || invoice.status === 'paid') {
      throw new BadRequestException(`Cannot mark a ${invoice.status} invoice as paid`);
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.amountPaid = invoice.total;
    invoice.amountDue = 0;

    return this.invoiceRepository.save(invoice);
  }

  async void(tenantId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot void a paid invoice');
    }

    invoice.status = 'void';

    return this.invoiceRepository.save(invoice);
  }

  async getOverdue(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.tenantId = :tenantId', { tenantId })
      .andWhere('invoice.status IN (:...statuses)', {
        statuses: ['sent', 'draft'],
      })
      .andWhere('invoice.dueDate < :now', { now: new Date() })
      .andWhere('invoice.amountDue > 0')
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }
}
