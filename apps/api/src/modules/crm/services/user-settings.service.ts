import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting } from '../entities/user-setting.entity';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly settingRepo: Repository<UserSetting>,
  ) {}

  async get(userId: string, section: string): Promise<Record<string, any>> {
    const setting = await this.settingRepo.findOne({
      where: { userId, section },
    });
    return setting?.settings ?? {};
  }

  async upsert(
    tenantId: string,
    userId: string,
    section: string,
    settings: Record<string, any>,
  ): Promise<UserSetting> {
    let existing = await this.settingRepo.findOne({
      where: { userId, section },
    });

    if (existing) {
      existing.settings = { ...existing.settings, ...settings };
      return this.settingRepo.save(existing);
    }

    const newSetting = this.settingRepo.create({
      tenantId,
      userId,
      section,
      settings,
    });
    return this.settingRepo.save(newSetting);
  }
}
