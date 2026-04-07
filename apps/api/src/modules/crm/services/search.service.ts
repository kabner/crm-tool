import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { Company } from '../entities/company.entity';
import { Deal } from '../entities/deal.entity';

export interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'deal';
  title: string;
  subtitle: string;
  url: string;
  score?: number;
}

export interface SearchResults {
  results: SearchResult[];
  total: number;
  query: string;
}

interface SearchOptions {
  limit?: number;
  types?: string[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Deal)
    private readonly dealRepo: Repository<Deal>,
  ) {}

  async globalSearch(
    tenantId: string,
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResults> {
    if (!query || query.length < 2) {
      return { results: [], total: 0, query };
    }

    const limit = options?.limit ?? 20;
    const types = options?.types ?? ['contact', 'company', 'deal'];
    const pattern = `%${query}%`;

    const searches: Promise<SearchResult[]>[] = [];

    if (types.includes('contact')) {
      searches.push(this.searchContacts(tenantId, pattern, limit));
    }

    if (types.includes('company')) {
      searches.push(this.searchCompanies(tenantId, pattern, limit));
    }

    if (types.includes('deal')) {
      searches.push(this.searchDeals(tenantId, pattern, limit));
    }

    const resultArrays = await Promise.all(searches);
    const allResults = resultArrays.flat();

    const limited = allResults.slice(0, limit);

    return {
      results: limited,
      total: allResults.length,
      query,
    };
  }

  private async searchContacts(
    tenantId: string,
    pattern: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const raw = pattern.replace(/%/g, '').trim();
    const parts = raw.split(/\s+/);
    const qb = this.contactRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (parts.length >= 2) {
      qb.andWhere(
        '((c.first_name ILIKE :first AND c.last_name ILIKE :last) OR c.email ILIKE :pattern OR c.phone ILIKE :pattern)',
        { first: `%${parts[0]}%`, last: `%${parts.slice(1).join(' ')}%`, pattern },
      );
    } else {
      qb.andWhere(
        '(c.first_name ILIKE :pattern OR c.last_name ILIKE :pattern OR c.email ILIKE :pattern OR c.phone ILIKE :pattern)',
        { pattern },
      );
    }

    const contacts = await qb.take(limit).getMany();

    return contacts.map((c) => ({
      id: c.id,
      type: 'contact' as const,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.email || '',
      url: `/contacts/${c.id}`,
    }));
  }

  private async searchCompanies(
    tenantId: string,
    pattern: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const companies = await this.companyRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .andWhere('(c.name ILIKE :pattern OR c.domain ILIKE :pattern)', {
        pattern,
      })
      .take(limit)
      .getMany();

    return companies.map((c) => ({
      id: c.id,
      type: 'company' as const,
      title: c.name,
      subtitle: c.domain || c.industry || '',
      url: `/companies/${c.id}`,
    }));
  }

  private async searchDeals(
    tenantId: string,
    pattern: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const deals = await this.dealRepo
      .createQueryBuilder('d')
      .where('d.tenant_id = :tenantId', { tenantId })
      .andWhere('d.name ILIKE :pattern', { pattern })
      .take(limit)
      .getMany();

    return deals.map((d) => ({
      id: d.id,
      type: 'deal' as const,
      title: d.name,
      subtitle: d.amount != null ? `$${d.amount}` : '',
      url: `/deals/${d.id}`,
    }));
  }
}
