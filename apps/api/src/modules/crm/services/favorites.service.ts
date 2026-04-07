import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from '../entities/user-favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavorite)
    private readonly favoriteRepo: Repository<UserFavorite>,
  ) {}

  async toggle(
    tenantId: string,
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<{ favorited: boolean }> {
    const existing = await this.favoriteRepo.findOne({
      where: { userId, entityType, entityId },
    });

    if (existing) {
      await this.favoriteRepo.remove(existing);
      return { favorited: false };
    }

    const favorite = this.favoriteRepo.create({
      tenantId,
      userId,
      entityType,
      entityId,
    });
    await this.favoriteRepo.save(favorite);
    return { favorited: true };
  }

  async findAll(
    tenantId: string,
    userId: string,
    entityType?: string,
  ): Promise<UserFavorite[]> {
    const where: any = { userId, tenantId };
    if (entityType) {
      where.entityType = entityType;
    }
    return this.favoriteRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async getFavoriteIds(userId: string, entityType: string): Promise<string[]> {
    const favorites = await this.favoriteRepo.find({
      where: { userId, entityType },
      select: ['entityId'],
    });
    return favorites.map((f) => f.entityId);
  }
}
