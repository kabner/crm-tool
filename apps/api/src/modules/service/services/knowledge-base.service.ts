import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KBCategory } from '../entities/kb-category.entity';
import { KBSection } from '../entities/kb-section.entity';
import { KBArticle } from '../entities/kb-article.entity';
import { CreateKBCategoryDto } from '../dto/create-kb-category.dto';
import { UpdateKBCategoryDto } from '../dto/update-kb-category.dto';
import { CreateKBSectionDto } from '../dto/create-kb-section.dto';
import { UpdateKBSectionDto } from '../dto/update-kb-section.dto';
import { CreateKBArticleDto } from '../dto/create-kb-article.dto';
import { UpdateKBArticleDto } from '../dto/update-kb-article.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KBCategory)
    private readonly categoryRepository: Repository<KBCategory>,
    @InjectRepository(KBSection)
    private readonly sectionRepository: Repository<KBSection>,
    @InjectRepository(KBArticle)
    private readonly articleRepository: Repository<KBArticle>,
  ) {}

  // ── Categories ──────────────────────────────────────────────────

  async createCategory(
    tenantId: string,
    dto: CreateKBCategoryDto,
  ): Promise<KBCategory> {
    const slug = dto.slug || slugify(dto.name);
    const category = this.categoryRepository.create({
      ...dto,
      slug,
      tenantId,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(tenantId: string): Promise<KBCategory[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('cat')
      .leftJoinAndSelect('cat.sections', 'section')
      .loadRelationCountAndMap('section.articleCount', 'section.articles')
      .where('cat.tenantId = :tenantId', { tenantId })
      .orderBy('cat.position', 'ASC')
      .addOrderBy('section.position', 'ASC')
      .getMany();

    return categories;
  }

  async updateCategory(
    tenantId: string,
    id: string,
    dto: UpdateKBCategoryDto,
  ): Promise<KBCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`KB Category "${id}" not found`);
    }
    if (dto.name && !dto.slug) {
      dto.slug = slugify(dto.name);
    }
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(tenantId: string, id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`KB Category "${id}" not found`);
    }
    await this.categoryRepository.remove(category);
  }

  // ── Sections ────────────────────────────────────────────────────

  async createSection(dto: CreateKBSectionDto): Promise<KBSection> {
    const slug = dto.slug || slugify(dto.name);
    const section = this.sectionRepository.create({ ...dto, slug });
    return this.sectionRepository.save(section);
  }

  async findSectionsByCategory(categoryId: string): Promise<KBSection[]> {
    return this.sectionRepository
      .createQueryBuilder('section')
      .loadRelationCountAndMap('section.articleCount', 'section.articles')
      .where('section.categoryId = :categoryId', { categoryId })
      .orderBy('section.position', 'ASC')
      .getMany();
  }

  async updateSection(
    id: string,
    dto: UpdateKBSectionDto,
  ): Promise<KBSection> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`KB Section "${id}" not found`);
    }
    if (dto.name && !dto.slug) {
      dto.slug = slugify(dto.name);
    }
    Object.assign(section, dto);
    return this.sectionRepository.save(section);
  }

  async removeSection(id: string): Promise<void> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (!section) {
      throw new NotFoundException(`KB Section "${id}" not found`);
    }
    await this.sectionRepository.remove(section);
  }

  // ── Articles ────────────────────────────────────────────────────

  async createArticle(
    tenantId: string,
    authorId: string,
    dto: CreateKBArticleDto,
  ): Promise<KBArticle> {
    const slug = slugify(dto.title);
    const article = this.articleRepository.create({
      ...dto,
      slug,
      tenantId,
      authorId,
    });
    return this.articleRepository.save(article);
  }

  async findAllArticles(
    tenantId: string,
    filters: {
      page?: number;
      limit?: number;
      sectionId?: string;
      status?: string;
      visibility?: string;
      search?: string;
    },
  ): Promise<{
    data: KBArticle[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20, sectionId, status, visibility, search } = filters;

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.section', 'section')
      .where('article.tenantId = :tenantId', { tenantId });

    if (sectionId) {
      qb.andWhere('article.sectionId = :sectionId', { sectionId });
    }

    if (status) {
      qb.andWhere('article.status = :status', { status });
    }

    if (visibility) {
      qb.andWhere('article.visibility = :visibility', { visibility });
    }

    if (search) {
      qb.andWhere(
        '(article.title ILIKE :search OR article.bodyHtml ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('article.position', 'ASC')
      .addOrderBy('article.createdAt', 'DESC');

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

  async findOneArticle(tenantId: string, id: string): Promise<KBArticle> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
      relations: ['section', 'section.category'],
    });
    if (!article) {
      throw new NotFoundException(`KB Article "${id}" not found`);
    }
    // Increment view count
    await this.articleRepository.increment({ id }, 'viewCount', 1);
    article.viewCount += 1;
    return article;
  }

  async findBySlug(
    tenantId: string,
    slug: string,
  ): Promise<KBArticle> {
    const article = await this.articleRepository.findOne({
      where: { slug, tenantId },
      relations: ['section', 'section.category'],
    });
    if (!article) {
      throw new NotFoundException(`KB Article with slug "${slug}" not found`);
    }
    await this.articleRepository.increment({ id: article.id }, 'viewCount', 1);
    article.viewCount += 1;
    return article;
  }

  async updateArticle(
    tenantId: string,
    id: string,
    dto: UpdateKBArticleDto,
  ): Promise<KBArticle> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
    });
    if (!article) {
      throw new NotFoundException(`KB Article "${id}" not found`);
    }
    if (dto.title && dto.title !== article.title) {
      (dto as any).slug = slugify(dto.title);
    }
    Object.assign(article, dto);
    article.version += 1;
    return this.articleRepository.save(article);
  }

  async publishArticle(tenantId: string, id: string): Promise<KBArticle> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
    });
    if (!article) {
      throw new NotFoundException(`KB Article "${id}" not found`);
    }
    article.status = 'published';
    article.publishedAt = new Date();
    return this.articleRepository.save(article);
  }

  async archiveArticle(tenantId: string, id: string): Promise<KBArticle> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
    });
    if (!article) {
      throw new NotFoundException(`KB Article "${id}" not found`);
    }
    article.status = 'archived';
    return this.articleRepository.save(article);
  }

  async removeArticle(tenantId: string, id: string): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { id, tenantId },
    });
    if (!article) {
      throw new NotFoundException(`KB Article "${id}" not found`);
    }
    await this.articleRepository.remove(article);
  }

  async search(
    tenantId: string,
    query: string,
    visibility?: string,
  ): Promise<KBArticle[]> {
    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.section', 'section')
      .where('article.tenantId = :tenantId', { tenantId })
      .andWhere('article.status = :status', { status: 'published' })
      .andWhere(
        '(article.title ILIKE :query OR article.bodyHtml ILIKE :query)',
        { query: `%${query}%` },
      );

    if (visibility) {
      qb.andWhere('article.visibility = :visibility', { visibility });
    }

    qb.orderBy('article.viewCount', 'DESC').take(20);

    return qb.getMany();
  }

  async feedback(
    tenantId: string,
    articleId: string,
    helpful: boolean,
  ): Promise<{ helpfulCount: number; notHelpfulCount: number }> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId, tenantId },
    });
    if (!article) {
      throw new NotFoundException(`KB Article "${articleId}" not found`);
    }

    if (helpful) {
      await this.articleRepository.increment({ id: articleId }, 'helpfulCount', 1);
      article.helpfulCount += 1;
    } else {
      await this.articleRepository.increment({ id: articleId }, 'notHelpfulCount', 1);
      article.notHelpfulCount += 1;
    }

    return {
      helpfulCount: article.helpfulCount,
      notHelpfulCount: article.notHelpfulCount,
    };
  }

  async getPopularArticles(
    tenantId: string,
    limit = 10,
  ): Promise<KBArticle[]> {
    return this.articleRepository.find({
      where: { tenantId, status: 'published' },
      relations: ['section'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }
}
