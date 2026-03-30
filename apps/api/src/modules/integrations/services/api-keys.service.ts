import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { APIKey } from '../entities/api-key.entity';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(APIKey)
    private readonly apiKeyRepository: Repository<APIKey>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ key: APIKey; plainKey: string }> {
    const randomPart = crypto.randomBytes(32).toString('hex');
    const plainKey = `crm_key_${randomPart}`;
    const keyPrefix = plainKey.substring(0, 16);
    const keyHash = await bcrypt.hash(plainKey, 10);

    const apiKey = this.apiKeyRepository.create({
      tenantId,
      name: dto.name,
      keyHash,
      keyPrefix,
      scopes: dto.scopes,
      rateLimit: dto.rateLimit ?? 100,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      createdBy: userId,
    });

    const saved = await this.apiKeyRepository.save(apiKey);

    return { key: saved, plainKey };
  }

  async findAll(tenantId: string): Promise<APIKey[]> {
    return this.apiKeyRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'name',
        'keyPrefix',
        'scopes',
        'rateLimit',
        'expiresAt',
        'lastUsedAt',
        'createdAt',
        'revokedAt',
      ],
    });
  }

  async findOne(tenantId: string, id: string): Promise<APIKey> {
    const key = await this.apiKeyRepository.findOne({
      where: { id, tenantId },
      select: [
        'id',
        'name',
        'keyPrefix',
        'scopes',
        'rateLimit',
        'expiresAt',
        'lastUsedAt',
        'createdAt',
        'revokedAt',
      ],
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return key;
  }

  async revoke(tenantId: string, id: string): Promise<APIKey> {
    const key = await this.apiKeyRepository.findOne({
      where: { id, tenantId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    key.revokedAt = new Date();
    return this.apiKeyRepository.save(key);
  }

  async validateKey(
    plainKey: string,
  ): Promise<APIKey | null> {
    const keyPrefix = plainKey.substring(0, 16);

    const keys = await this.apiKeyRepository.find({
      where: { keyPrefix, revokedAt: IsNull() },
    });

    for (const key of keys) {
      const isMatch = await bcrypt.compare(plainKey, key.keyHash);
      if (isMatch) {
        if (key.expiresAt && key.expiresAt < new Date()) {
          return null;
        }

        key.lastUsedAt = new Date();
        await this.apiKeyRepository.save(key);

        return key;
      }
    }

    return null;
  }
}
