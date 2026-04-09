import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeRate } from '../entities/exchange-rate.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(ExchangeRate)
    private readonly repo: Repository<ExchangeRate>,
  ) {}

  async getRates(tenantId: string): Promise<ExchangeRate[]> {
    return this.repo.find({
      where: { tenantId },
      order: { fromCurrency: 'ASC', toCurrency: 'ASC' },
    });
  }

  async upsertRate(
    tenantId: string,
    fromCurrency: string,
    toCurrency: string,
    rate: number,
  ): Promise<ExchangeRate> {
    const existing = await this.repo.findOne({
      where: { tenantId, fromCurrency, toCurrency },
    });
    if (existing) {
      existing.rate = rate;
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({ tenantId, fromCurrency, toCurrency, rate }),
    );
  }

  async convert(
    tenantId: string,
    amount: number,
    from: string,
    to: string,
  ): Promise<number> {
    if (from === to) return amount;
    const rate = await this.repo.findOne({
      where: { tenantId, fromCurrency: from, toCurrency: to },
    });
    if (rate) return amount * Number(rate.rate);
    // Try reverse
    const reverseRate = await this.repo.findOne({
      where: { tenantId, fromCurrency: to, toCurrency: from },
    });
    if (reverseRate) return amount / Number(reverseRate.rate);
    return amount; // No rate found, return as-is
  }
}
