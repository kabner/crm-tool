import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Contact } from '../entities/contact.entity';
import { Company } from '../entities/company.entity';

const DEFAULT_CONTACT_COLUMNS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'jobTitle',
  'lifecycleStage',
  'leadStatus',
  'source',
  'tags',
  'createdAt',
];

const DEFAULT_COMPANY_COLUMNS = [
  'name',
  'domain',
  'industry',
  'size',
  'phone',
  'address',
  'createdAt',
];

const VALID_CONTACT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'jobTitle',
  'lifecycleStage',
  'leadStatus',
  'source',
  'tags',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class ImportExportService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async exportContacts(
    tenantId: string,
    filters?: Record<string, any>,
    columns?: string[],
  ): Promise<string> {
    const selectedColumns = columns?.length
      ? columns
      : DEFAULT_CONTACT_COLUMNS;

    const batchSize = 1000;
    let offset = 0;
    const allRows: Record<string, any>[] = [];

    while (true) {
      const qb = this.contactRepository
        .createQueryBuilder('contact')
        .where('contact.tenantId = :tenantId', { tenantId });

      this.applyContactFilters(qb, filters);

      qb.orderBy('contact.createdAt', 'DESC')
        .skip(offset)
        .take(batchSize);

      const batch = await qb.getMany();
      if (batch.length === 0) break;

      for (const contact of batch) {
        const row: Record<string, any> = {};
        for (const col of selectedColumns) {
          const value = (contact as any)[col];
          if (col === 'tags' && Array.isArray(value)) {
            row[col] = value.join(';');
          } else if (col === 'createdAt' && value instanceof Date) {
            row[col] = value.toISOString();
          } else {
            row[col] = value ?? '';
          }
        }
        allRows.push(row);
      }

      offset += batchSize;
      if (batch.length < batchSize) break;
    }

    return stringify(allRows, {
      header: true,
      columns: selectedColumns,
    });
  }

  async exportCompanies(
    tenantId: string,
    filters?: Record<string, any>,
    columns?: string[],
  ): Promise<string> {
    const selectedColumns = columns?.length
      ? columns
      : DEFAULT_COMPANY_COLUMNS;

    const batchSize = 1000;
    let offset = 0;
    const allRows: Record<string, any>[] = [];

    while (true) {
      const qb = this.companyRepository
        .createQueryBuilder('company')
        .where('company.tenantId = :tenantId', { tenantId });

      this.applyCompanyFilters(qb, filters);

      qb.orderBy('company.createdAt', 'DESC')
        .skip(offset)
        .take(batchSize);

      const batch = await qb.getMany();
      if (batch.length === 0) break;

      for (const company of batch) {
        const row: Record<string, any> = {};
        for (const col of selectedColumns) {
          const value = (company as any)[col];
          if (col === 'address' && typeof value === 'object' && value !== null) {
            row[col] = JSON.stringify(value);
          } else if (col === 'createdAt' && value instanceof Date) {
            row[col] = value.toISOString();
          } else {
            row[col] = value ?? '';
          }
        }
        allRows.push(row);
      }

      offset += batchSize;
      if (batch.length < batchSize) break;
    }

    return stringify(allRows, {
      header: true,
      columns: selectedColumns,
    });
  }

  async parseCSV(
    buffer: Buffer,
  ): Promise<{
    headers: string[];
    preview: Record<string, string>[];
    totalRows: number;
  }> {
    const content = buffer.toString('utf-8');

    let records: Record<string, string>[];
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException(
        'Invalid CSV file. Please check the format and try again.',
      );
    }

    if (records.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows.');
    }

    const headers = Object.keys(records[0] as Record<string, string>);
    const preview = records.slice(0, 5);

    return {
      headers,
      preview,
      totalRows: records.length,
    };
  }

  async importContacts(
    tenantId: string,
    userId: string,
    csvData: Buffer,
    fieldMapping: Record<string, string> | undefined,
    options: {
      duplicateHandling: 'skip' | 'update' | 'create';
      duplicateField: string;
    },
  ): Promise<{
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; error: string }[];
  }> {
    const content = csvData.toString('utf-8');

    let records: Record<string, string>[];
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV file.');
    }

    const mapping = fieldMapping ?? {};

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as { row: number; error: string }[],
    };

    const batchSize = 500;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2; // +2 for 1-based index + header row
        const csvRow = batch[j] as Record<string, string>;
        if (!csvRow) continue;

        try {
          const mapped = this.mapRowToContact(csvRow, mapping);

          // Validate required fields
          const validationError = this.validateContactRow(mapped);
          if (validationError) {
            results.errors.push({ row: rowIndex, error: validationError });
            continue;
          }

          // Check for duplicates
          const duplicateFieldValue =
            mapped[options.duplicateField as keyof typeof mapped];

          if (duplicateFieldValue && options.duplicateHandling !== 'create') {
            const existing = await this.contactRepository.findOne({
              where: {
                tenantId,
                [options.duplicateField]: duplicateFieldValue,
              },
            });

            if (existing) {
              if (options.duplicateHandling === 'skip') {
                results.skipped++;
                continue;
              }

              if (options.duplicateHandling === 'update') {
                // Merge fields — only overwrite non-empty values
                for (const [key, value] of Object.entries(mapped)) {
                  if (value !== undefined && value !== '' && value !== null) {
                    (existing as any)[key] = value;
                  }
                }
                await this.contactRepository.save(existing);
                results.updated++;
                continue;
              }
            }
          }

          // Create new contact
          const contact = this.contactRepository.create({
            ...mapped,
            tenantId,
            source: 'csv_import',
          });
          await this.contactRepository.save(contact);
          results.created++;
        } catch (err: any) {
          results.errors.push({
            row: rowIndex,
            error: err.message || 'Unknown error',
          });
        }
      }
    }

    return results;
  }

  private mapRowToContact(
    csvRow: Record<string, string>,
    fieldMapping: Record<string, string>,
  ): Partial<Contact> {
    const mapped: Record<string, any> = {};

    for (const [csvColumn, crmField] of Object.entries(fieldMapping)) {
      if (!crmField || !VALID_CONTACT_FIELDS.includes(crmField)) continue;

      const rawValue = csvRow[csvColumn];
      if (rawValue === undefined || rawValue === '') continue;

      if (crmField === 'tags') {
        mapped[crmField] = rawValue
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean);
      } else {
        mapped[crmField] = rawValue;
      }
    }

    return mapped as Partial<Contact>;
  }

  private validateContactRow(row: Partial<Contact>): string | null {
    if (!row.firstName && !row.lastName) {
      return 'First name or last name is required.';
    }

    if (row.email && !EMAIL_REGEX.test(row.email)) {
      return `Invalid email format: ${row.email}`;
    }

    return null;
  }

  private applyContactFilters(
    qb: any,
    filters?: Record<string, any>,
  ): void {
    if (!filters) return;

    if (filters.search) {
      qb.andWhere(
        '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.lifecycleStage) {
      qb.andWhere('contact.lifecycleStage = :lifecycleStage', {
        lifecycleStage: filters.lifecycleStage,
      });
    }

    if (filters.leadStatus) {
      qb.andWhere('contact.leadStatus = :leadStatus', {
        leadStatus: filters.leadStatus,
      });
    }

    if (filters.ownerId) {
      qb.andWhere('contact.ownerId = :ownerId', {
        ownerId: filters.ownerId,
      });
    }

    if (filters.tags) {
      const tagList = filters.tags.split(',').map((t: string) => t.trim());
      qb.andWhere('contact.tags && :tags', { tags: tagList });
    }
  }

  private applyCompanyFilters(
    qb: any,
    filters?: Record<string, any>,
  ): void {
    if (!filters) return;

    if (filters.search) {
      qb.andWhere(
        '(company.name ILIKE :search OR company.domain ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.industry) {
      qb.andWhere('company.industry = :industry', {
        industry: filters.industry,
      });
    }

    if (filters.size) {
      qb.andWhere('company.size = :size', { size: filters.size });
    }

    if (filters.ownerId) {
      qb.andWhere('company.ownerId = :ownerId', {
        ownerId: filters.ownerId,
      });
    }
  }
}
