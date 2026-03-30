import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async create(tenantId: string, dto: CreatePaymentDto): Promise<Payment> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: dto.invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${dto.invoiceId}" not found`);
    }

    if (invoice.status === 'void') {
      throw new BadRequestException('Cannot pay a voided invoice');
    }

    if (dto.amount > invoice.amountDue) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds amount due (${invoice.amountDue})`,
      );
    }

    const payment = this.paymentRepository.create({
      tenantId,
      invoiceId: dto.invoiceId,
      contactId: invoice.contactId,
      amount: dto.amount,
      method: dto.method,
      status: 'succeeded',
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice
    invoice.amountPaid += dto.amount;
    invoice.amountDue -= dto.amount;

    if (invoice.amountDue <= 0) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.amountDue = 0;
    }

    await this.invoiceRepository.save(invoice);

    return savedPayment;
  }

  async findAll(
    tenantId: string,
    filters: { page?: number; limit?: number },
  ): Promise<{
    data: Payment[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [data, total] = await this.paymentRepository.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

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

  async findByInvoice(tenantId: string, invoiceId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { tenantId, invoiceId },
      order: { createdAt: 'DESC' },
    });
  }

  async refund(
    tenantId: string,
    paymentId: string,
    amount: number,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, tenantId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID "${paymentId}" not found`);
    }

    if (payment.status !== 'succeeded') {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    const maxRefund = payment.amount - payment.refundedAmount;
    if (amount > maxRefund) {
      throw new BadRequestException(
        `Refund amount (${amount}) exceeds refundable amount (${maxRefund})`,
      );
    }

    payment.refundedAmount += amount;
    if (payment.refundedAmount >= payment.amount) {
      payment.status = 'refunded';
    }

    const updatedPayment = await this.paymentRepository.save(payment);

    // Update invoice
    const invoice = await this.invoiceRepository.findOne({
      where: { id: payment.invoiceId, tenantId },
    });

    if (invoice) {
      invoice.amountPaid -= amount;
      invoice.amountDue += amount;
      if (invoice.status === 'paid') {
        invoice.status = 'sent';
        invoice.paidAt = null;
      }
      await this.invoiceRepository.save(invoice);
    }

    return updatedPayment;
  }
}
