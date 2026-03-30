import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Price } from '../entities/price.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
  ) {}

  async create(tenantId: string, dto: CreateProductDto): Promise<Product & { prices: Price[] }> {
    const { prices, ...productData } = dto;

    const product = this.productRepository.create({
      ...productData,
      tenantId,
    });
    const savedProduct = await this.productRepository.save(product);

    let savedPrices: Price[] = [];
    if (prices?.length) {
      const priceEntities = prices.map((p) =>
        this.priceRepository.create({
          ...p,
          currency: p.currency ?? 'USD',
          intervalCount: p.intervalCount ?? 1,
          trialDays: p.trialDays ?? 0,
          productId: savedProduct.id,
        }),
      );
      savedPrices = await this.priceRepository.save(priceEntities);
    }

    return { ...savedProduct, prices: savedPrices };
  }

  async findAll(
    tenantId: string,
    filters: { page?: number; limit?: number; search?: string; status?: string },
  ): Promise<{
    data: (Product & { prices: Price[] })[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 20, search, status } = filters;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.prices',
        Price,
        'price',
        'price.productId = product.id AND price.status = :priceStatus',
        { priceStatus: 'active' },
      )
      .where('product.tenantId = :tenantId', { tenantId });

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('product.status = :status', { status });
    } else {
      qb.andWhere('product.status != :archived', { archived: 'archived' });
    }

    qb.orderBy('product.createdAt', 'DESC');

    const skip = (page - 1) * limit;

    // Get total count (without joins to avoid duplicates)
    const countQb = this.productRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId });

    if (search) {
      countQb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) {
      countQb.andWhere('product.status = :status', { status });
    } else {
      countQb.andWhere('product.status != :archived', { archived: 'archived' });
    }

    const total = await countQb.getCount();

    qb.skip(skip).take(limit);
    const data = await qb.getMany();

    return {
      data: data as (Product & { prices: Price[] })[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string): Promise<Product & { prices: Price[] }> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndMapMany(
        'product.prices',
        Price,
        'price',
        'price.productId = product.id',
      )
      .where('product.id = :id', { id })
      .andWhere('product.tenantId = :tenantId', { tenantId })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product as Product & { prices: Price[] };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product & { prices: Price[] }> {
    const product = await this.findOne(tenantId, id);
    const { prices, ...updateData } = dto;

    Object.assign(product, updateData);
    await this.productRepository.save(product);

    if (prices !== undefined) {
      // Archive existing prices
      await this.priceRepository
        .createQueryBuilder()
        .update(Price)
        .set({ status: 'archived' })
        .where('productId = :productId', { productId: id })
        .execute();

      // Create new prices
      if (prices.length) {
        const priceEntities = prices.map((p) =>
          this.priceRepository.create({
            ...p,
            currency: p.currency ?? 'USD',
            intervalCount: p.intervalCount ?? 1,
            trialDays: p.trialDays ?? 0,
            productId: id,
          }),
        );
        await this.priceRepository.save(priceEntities);
      }
    }

    return this.findOne(tenantId, id);
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const product = await this.findOne(tenantId, id);
    product.status = 'archived';
    await this.productRepository.save(product);
  }
}
