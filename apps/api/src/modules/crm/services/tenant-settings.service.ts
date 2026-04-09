import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSetting } from '../entities/tenant-setting.entity';

@Injectable()
export class TenantSettingsService {
  constructor(
    @InjectRepository(TenantSetting)
    private readonly settingRepo: Repository<TenantSetting>,
  ) {}

  async get(tenantId: string, key: string): Promise<Record<string, any>> {
    const setting = await this.settingRepo.findOne({
      where: { tenantId, key },
    });
    return setting?.value ?? {};
  }

  async upsert(
    tenantId: string,
    key: string,
    value: Record<string, any>,
  ): Promise<TenantSetting> {
    let existing = await this.settingRepo.findOne({
      where: { tenantId, key },
    });

    if (existing) {
      existing.value = { ...existing.value, ...value };
      return this.settingRepo.save(existing);
    }

    const newSetting = this.settingRepo.create({
      tenantId,
      key,
      value,
    });
    return this.settingRepo.save(newSetting);
  }
}
