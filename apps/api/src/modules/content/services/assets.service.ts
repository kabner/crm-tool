import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { Asset } from '../entities/asset.entity';
import { AssetFolder } from '../entities/asset-folder.entity';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { CreateAssetFolderDto } from '../dto/create-asset-folder.dto';
import { UpdateAssetFolderDto } from '../dto/update-asset-folder.dto';

@Injectable()
export class AssetsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetFolder)
    private readonly folderRepo: Repository<AssetFolder>,
  ) {
    // Resolve to project root uploads/ directory
    this.uploadDir = path.resolve(process.cwd(), '..', '..', 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    folderId?: string,
  ): Promise<Asset> {
    const fileExt = path.extname(file.originalname);
    const uniqueName = `${randomUUID()}${fileExt}`;
    const tenantDir = path.join(this.uploadDir, tenantId);

    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const filePath = path.join(tenantDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    // Determine image dimensions if applicable
    let width: number | null = null;
    let height: number | null = null;
    if (file.mimetype.startsWith('image/')) {
      const dimensions = this.getImageDimensions(file.buffer);
      if (dimensions) {
        width = dimensions.width;
        height = dimensions.height;
      }
    }

    const s3Key = `${tenantId}/${uniqueName}`;

    const asset = this.assetRepo.create({
      tenantId,
      filename: uniqueName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      s3Key,
      cdnUrl: `/uploads/${s3Key}`,
      width,
      height,
      folderId: folderId ?? null,
      uploadedBy: userId,
      tags: [],
      metadata: {},
      thumbnails: {},
    });

    return this.assetRepo.save(asset);
  }

  async findAll(
    tenantId: string,
    filters: {
      folderId?: string;
      search?: string;
      mimeType?: string;
      limit?: number;
      page?: number;
    } = {},
  ) {
    const limit = filters.limit || 40;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    const qb = this.assetRepo
      .createQueryBuilder('asset')
      .where('asset.tenantId = :tenantId', { tenantId });

    if (filters.folderId) {
      qb.andWhere('asset.folderId = :folderId', {
        folderId: filters.folderId,
      });
    }

    if (filters.search) {
      qb.andWhere(
        '(asset.originalName ILIKE :search OR asset.title ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.mimeType) {
      qb.andWhere('asset.mimeType LIKE :mimeType', {
        mimeType: `${filters.mimeType}%`,
      });
    }

    qb.orderBy('asset.createdAt', 'DESC');

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

  async findOne(tenantId: string, id: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({
      where: { id, tenantId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset ${id} not found`);
    }
    return asset;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAssetDto,
  ): Promise<Asset> {
    const asset = await this.findOne(tenantId, id);

    if (dto.altText !== undefined) asset.altText = dto.altText ?? null;
    if (dto.title !== undefined) asset.title = dto.title ?? null;
    if (dto.folderId !== undefined) asset.folderId = dto.folderId ?? null;
    if (dto.tags !== undefined) asset.tags = dto.tags ?? [];

    return this.assetRepo.save(asset);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const asset = await this.findOne(tenantId, id);

    // Delete file from filesystem
    const filePath = path.join(this.uploadDir, asset.s3Key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.assetRepo.remove(asset);
  }

  // Folder operations

  async createFolder(
    tenantId: string,
    dto: CreateAssetFolderDto,
  ): Promise<AssetFolder> {
    const folder = this.folderRepo.create({
      tenantId,
      name: dto.name,
      parentId: dto.parentId ?? null,
    });
    return this.folderRepo.save(folder);
  }

  async getFolders(tenantId: string, parentId?: string) {
    const where: Record<string, any> = { tenantId };
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null as any;
    }

    return this.folderRepo.find({
      where,
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  async updateFolder(
    tenantId: string,
    id: string,
    dto: UpdateAssetFolderDto,
  ): Promise<AssetFolder> {
    const folder = await this.folderRepo.findOne({
      where: { id, tenantId },
    });
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found`);
    }

    if (dto.name !== undefined) folder.name = dto.name;
    if (dto.parentId !== undefined) folder.parentId = dto.parentId ?? null;

    return this.folderRepo.save(folder);
  }

  async removeFolder(tenantId: string, id: string): Promise<void> {
    const folder = await this.folderRepo.findOne({
      where: { id, tenantId },
    });
    if (!folder) {
      throw new NotFoundException(`Folder ${id} not found`);
    }
    await this.folderRepo.remove(folder);
  }

  /**
   * Basic image dimension extraction from PNG/JPEG headers.
   * Works without external dependencies.
   */
  private getImageDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    try {
      // PNG: width at offset 16, height at offset 20 (big-endian uint32)
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20),
        };
      }

      // JPEG: search for SOF0/SOF2 marker
      if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        let offset = 2;
        while (offset < buffer.length - 8) {
          if (buffer[offset] !== 0xff) break;
          const marker = buffer[offset + 1];
          if (marker === 0xc0 || marker === 0xc2) {
            return {
              height: buffer.readUInt16BE(offset + 5),
              width: buffer.readUInt16BE(offset + 7),
            };
          }
          const segLen = buffer.readUInt16BE(offset + 2);
          offset += 2 + segLen;
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
