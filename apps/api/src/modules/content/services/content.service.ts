import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentPage } from '../entities/content-page.entity';
import { ContentVersion } from '../entities/content-version.entity';
import { CreateContentPageDto } from '../dto/create-content-page.dto';
import { UpdateContentPageDto } from '../dto/update-content-page.dto';
import { ContentFilterDto } from '../dto/content-filter.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentPage)
    private readonly pageRepo: Repository<ContentPage>,
    @InjectRepository(ContentVersion)
    private readonly versionRepo: Repository<ContentVersion>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateContentPageDto,
  ): Promise<ContentPage> {
    const slug = dto.slug || this.generateSlug(dto.title);

    // Ensure slug uniqueness within tenant
    const existing = await this.pageRepo.findOne({
      where: { tenantId, slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${slug}" already exists`);
    }

    const { wordCount, readingTimeMin } = this.calculateReadingStats(dto.bodyJson);

    const page = this.pageRepo.create({
      tenantId,
      authorId: userId,
      title: dto.title,
      type: dto.type,
      slug,
      bodyJson: dto.bodyJson,
      excerpt: dto.excerpt ?? null,
      categoryId: dto.categoryId ?? null,
      tags: dto.tags ?? [],
      seoTitle: dto.seoTitle ?? null,
      seoDescription: dto.seoDescription ?? null,
      ogImage: dto.ogImage ?? null,
      status: dto.status || 'draft',
      wordCount,
      readingTimeMin,
      version: 1,
    });

    return this.pageRepo.save(page);
  }

  async findAll(tenantId: string, filters: ContentFilterDto) {
    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const qb = this.pageRepo
      .createQueryBuilder('page')
      .where('page.tenantId = :tenantId', { tenantId });

    if (filters.type) {
      qb.andWhere('page.type = :type', { type: filters.type });
    }

    if (filters.status) {
      qb.andWhere('page.status = :status', { status: filters.status });
    }

    if (filters.categoryId) {
      qb.andWhere('page.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.search) {
      qb.andWhere(
        '(page.title ILIKE :search OR page.excerpt ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.tags) {
      const tagList = filters.tags.split(',').map((t) => t.trim());
      qb.andWhere('page.tags && :tags', { tags: tagList });
    }

    const sortField = filters.sort || 'createdAt';
    const sortOrder = filters.order || 'DESC';
    qb.orderBy(`page.${sortField}`, sortOrder as 'ASC' | 'DESC');

    const [data, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

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

  async findOne(tenantId: string, id: string): Promise<ContentPage> {
    const page = await this.pageRepo.findOne({
      where: { id, tenantId },
    });
    if (!page) {
      throw new NotFoundException(`Content page ${id} not found`);
    }
    return page;
  }

  async findBySlug(tenantId: string, slug: string): Promise<ContentPage> {
    const page = await this.pageRepo.findOne({
      where: { tenantId, slug },
    });
    if (!page) {
      throw new NotFoundException(`Content page with slug "${slug}" not found`);
    }
    return page;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateContentPageDto,
  ): Promise<ContentPage> {
    const page = await this.findOne(tenantId, id);

    // Create version snapshot before updating
    await this.versionRepo.save(
      this.versionRepo.create({
        pageId: page.id,
        version: page.version,
        bodyJson: page.bodyJson,
        title: page.title,
        changedBy: page.authorId,
        changeSummary: null,
      }),
    );

    if (dto.title !== undefined) page.title = dto.title;
    if (dto.type !== undefined) page.type = dto.type;
    if (dto.slug !== undefined) {
      // Check slug uniqueness
      const existing = await this.pageRepo.findOne({
        where: { tenantId, slug: dto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Slug "${dto.slug}" already exists`);
      }
      page.slug = dto.slug;
    }
    if (dto.bodyJson !== undefined) {
      page.bodyJson = dto.bodyJson;
      const stats = this.calculateReadingStats(dto.bodyJson);
      page.wordCount = stats.wordCount;
      page.readingTimeMin = stats.readingTimeMin;
    }
    if (dto.excerpt !== undefined) page.excerpt = dto.excerpt ?? null;
    if (dto.categoryId !== undefined) page.categoryId = dto.categoryId ?? null;
    if (dto.tags !== undefined) page.tags = dto.tags ?? [];
    if (dto.seoTitle !== undefined) page.seoTitle = dto.seoTitle ?? null;
    if (dto.seoDescription !== undefined)
      page.seoDescription = dto.seoDescription ?? null;
    if (dto.ogImage !== undefined) page.ogImage = dto.ogImage ?? null;
    if (dto.status !== undefined) page.status = dto.status;

    page.version += 1;

    return this.pageRepo.save(page);
  }

  async publish(tenantId: string, id: string): Promise<ContentPage> {
    const page = await this.findOne(tenantId, id);
    page.status = 'published';
    page.publishedAt = new Date();
    page.scheduledAt = null;
    return this.pageRepo.save(page);
  }

  async unpublish(tenantId: string, id: string): Promise<ContentPage> {
    const page = await this.findOne(tenantId, id);
    page.status = 'draft';
    return this.pageRepo.save(page);
  }

  async schedule(
    tenantId: string,
    id: string,
    scheduledAt: Date,
  ): Promise<ContentPage> {
    const page = await this.findOne(tenantId, id);
    page.status = 'scheduled';
    page.scheduledAt = scheduledAt;
    return this.pageRepo.save(page);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const page = await this.findOne(tenantId, id);
    await this.pageRepo.remove(page);
  }

  async getVersions(tenantId: string, pageId: string) {
    // Ensure page exists and belongs to tenant
    await this.findOne(tenantId, pageId);

    return this.versionRepo.find({
      where: { pageId },
      order: { version: 'DESC' },
    });
  }

  async revertToVersion(
    tenantId: string,
    pageId: string,
    versionId: string,
  ): Promise<ContentPage> {
    const page = await this.findOne(tenantId, pageId);
    const version = await this.versionRepo.findOne({
      where: { id: versionId, pageId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    // Save current as a version before reverting
    await this.versionRepo.save(
      this.versionRepo.create({
        pageId: page.id,
        version: page.version,
        bodyJson: page.bodyJson,
        title: page.title,
        changedBy: page.authorId,
        changeSummary: `Before revert to version ${version.version}`,
      }),
    );

    page.title = version.title;
    page.bodyJson = version.bodyJson;
    page.version += 1;

    const stats = this.calculateReadingStats(version.bodyJson);
    page.wordCount = stats.wordCount;
    page.readingTimeMin = stats.readingTimeMin;

    return this.pageRepo.save(page);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private calculateReadingStats(bodyJson: Record<string, any>): {
    wordCount: number;
    readingTimeMin: number;
  } {
    const text = this.extractText(bodyJson);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
    return { wordCount, readingTimeMin };
  }

  private extractText(obj: unknown): string {
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.extractText(item)).join(' ');
    if (obj && typeof obj === 'object') {
      return Object.values(obj)
        .map((val) => this.extractText(val))
        .join(' ');
    }
    return '';
  }
}
