# v0.3 CRM Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all v0.3 requirements across Contacts, Companies, Pipelines (renamed from Deals), and Settings — with full-name search, phone formatting, filter/sort redesign, favorites, lifecycle stage on companies, and pipeline card enhancements.

**Architecture:** Backend changes first (migrations, entities, services, controllers), then shared frontend components, then page-level frontend changes. Each section's requirements are self-contained tasks that can be parallelized after the shared infrastructure is in place.

**Tech Stack:** NestJS + TypeORM (backend), Next.js 15 + React 19 + TanStack Query + Tailwind + Radix UI (frontend), PostgreSQL 16, Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-04-07-v03-crm-enhancements-design.md`
**Requirements checklist:** `v0.3.md` — check off each `[]` as `[x]` after verified working.

---

## File Map

### New Files
```
# Backend
apps/api/src/database/migrations/1712000000000-V03SchemaChanges.ts
apps/api/src/modules/crm/entities/user-favorite.entity.ts
apps/api/src/modules/crm/entities/user-setting.entity.ts
apps/api/src/modules/crm/services/favorites.service.ts
apps/api/src/modules/crm/controllers/favorites.controller.ts
apps/api/src/modules/crm/services/user-settings.service.ts
apps/api/src/modules/crm/controllers/user-settings.controller.ts
apps/api/src/modules/crm/dto/create-favorite.dto.ts
apps/api/src/modules/crm/dto/user-setting.dto.ts

# Frontend - Shared Components
apps/web/src/components/ui/phone-input.tsx
apps/web/src/components/ui/phone-display.tsx
apps/web/src/components/filter-bar/filter-bar.tsx
apps/web/src/components/filter-bar/filter-pill.tsx
apps/web/src/components/filter-bar/filter-popover.tsx
apps/web/src/components/sortable-table-header.tsx
apps/web/src/components/column-picker.tsx
apps/web/src/components/favorite-button.tsx
apps/web/src/components/record-count.tsx

# Frontend - Hooks
apps/web/src/hooks/use-favorites.ts
apps/web/src/hooks/use-user-settings.ts

# Frontend - Settings Pages
apps/web/src/app/(dashboard)/settings/page.tsx
apps/web/src/app/(dashboard)/settings/layout.tsx
apps/web/src/app/(dashboard)/settings/contacts/page.tsx
apps/web/src/app/(dashboard)/settings/companies/page.tsx
apps/web/src/app/(dashboard)/settings/pipelines/page.tsx
apps/web/src/app/(dashboard)/settings/marketing/page.tsx
apps/web/src/app/(dashboard)/settings/service/page.tsx
apps/web/src/app/(dashboard)/settings/content/page.tsx
apps/web/src/app/(dashboard)/settings/commerce/page.tsx
apps/web/src/app/(dashboard)/settings/data/page.tsx
apps/web/src/app/(dashboard)/settings/users/page.tsx
apps/web/src/app/(dashboard)/settings/account/page.tsx
```

### Modified Files
```
# Backend
apps/api/src/modules/crm/entities/contact.entity.ts
apps/api/src/modules/crm/entities/company.entity.ts
apps/api/src/modules/crm/entities/index.ts
apps/api/src/modules/crm/services/contacts.service.ts
apps/api/src/modules/crm/services/companies.service.ts
apps/api/src/modules/crm/services/search.service.ts
apps/api/src/modules/crm/controllers/contacts.controller.ts
apps/api/src/modules/crm/controllers/companies.controller.ts
apps/api/src/modules/crm/dto/create-contact.dto.ts
apps/api/src/modules/crm/dto/update-contact.dto.ts
apps/api/src/modules/crm/dto/contact-filter.dto.ts
apps/api/src/modules/crm/dto/create-company.dto.ts
apps/api/src/modules/crm/dto/company-filter.dto.ts
apps/api/src/modules/crm/crm.module.ts

# Frontend
apps/web/src/app/(dashboard)/layout.tsx
apps/web/src/app/(dashboard)/contacts/page.tsx
apps/web/src/app/(dashboard)/contacts/components/contacts-table.tsx
apps/web/src/app/(dashboard)/contacts/components/contact-form.tsx
apps/web/src/app/(dashboard)/contacts/[id]/page.tsx
apps/web/src/app/(dashboard)/companies/page.tsx
apps/web/src/app/(dashboard)/companies/components/companies-table.tsx
apps/web/src/app/(dashboard)/companies/components/company-form.tsx
apps/web/src/app/(dashboard)/companies/[id]/page.tsx
apps/web/src/app/(dashboard)/deals/page.tsx
apps/web/src/app/(dashboard)/deals/components/pipeline-board.tsx
apps/web/src/app/(dashboard)/deals/components/deals-table.tsx
apps/web/src/hooks/use-contacts.ts
apps/web/src/hooks/use-companies.ts
apps/web/src/hooks/use-deals.ts
apps/web/src/hooks/use-saved-views.ts
```

---

## Task 1: Database Migration

**Files:**
- Create: `apps/api/src/database/migrations/1712000000000-V03SchemaChanges.ts`

This migration adds all schema changes needed for v0.3.

- [ ] **Step 1: Write the migration file**

```typescript
// apps/api/src/database/migrations/1712000000000-V03SchemaChanges.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class V03SchemaChanges1712000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add lifecycle_stage to companies
    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN lifecycle_stage varchar NOT NULL DEFAULT 'lead'
    `);

    // 2. Add created_by_id to contacts
    await queryRunner.query(`
      ALTER TABLE contacts
      ADD COLUMN created_by_id uuid REFERENCES users(id) ON DELETE SET NULL
    `);

    // 3. Add created_by_id to companies
    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN created_by_id uuid REFERENCES users(id) ON DELETE SET NULL
    `);

    // 4. Backfill created_by_id from owner_id for existing records
    await queryRunner.query(`
      UPDATE contacts SET created_by_id = owner_id WHERE owner_id IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE companies SET created_by_id = owner_id WHERE owner_id IS NOT NULL
    `);

    // 5. Migrate lifecycle_stage from contacts to companies
    // For contacts that have a company association, copy lifecycle_stage to their company
    await queryRunner.query(`
      UPDATE companies c
      SET lifecycle_stage = sub.lifecycle_stage
      FROM (
        SELECT DISTINCT ON (cc.company_id) cc.company_id, ct.lifecycle_stage
        FROM contact_companies cc
        JOIN contacts ct ON ct.id = cc.contact_id
        WHERE ct.lifecycle_stage IS NOT NULL AND ct.lifecycle_stage != 'lead'
        ORDER BY cc.company_id, ct.updated_at DESC
      ) sub
      WHERE c.id = sub.company_id
    `);

    // 6. Make company association required on contacts via a join table constraint
    // We add a company_id direct FK for convenience (primary company)
    await queryRunner.query(`
      ALTER TABLE contacts
      ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL
    `);

    // Backfill company_id from existing contact_companies (pick first association)
    await queryRunner.query(`
      UPDATE contacts c
      SET company_id = sub.company_id
      FROM (
        SELECT DISTINCT ON (contact_id) contact_id, company_id
        FROM contact_companies
        ORDER BY contact_id, created_at ASC
      ) sub
      WHERE c.id = sub.contact_id
    `);

    // 7. Create user_favorites table
    await queryRunner.query(`
      CREATE TABLE user_favorites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type varchar NOT NULL,
        entity_id uuid NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id, entity_type, entity_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_favorites_user_entity ON user_favorites(user_id, entity_type)
    `);

    // 8. Create user_settings table
    await queryRunner.query(`
      CREATE TABLE user_settings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        section varchar NOT NULL,
        settings jsonb NOT NULL DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(user_id, section)
      )
    `);

    // 9. Drop lifecycle_stage from contacts (data migrated to companies)
    await queryRunner.query(`
      ALTER TABLE contacts DROP COLUMN lifecycle_stage
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse in opposite order
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN lifecycle_stage varchar DEFAULT 'lead'
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS user_settings`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_favorites`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS company_id`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS created_by_id`);
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS created_by_id`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN IF EXISTS lifecycle_stage`);
  }
}
```

- [ ] **Step 2: Run the migration locally**

Run: `cd apps/api && pnpm db:migrate`
Expected: Migration runs successfully, no errors.

- [ ] **Step 3: Verify schema changes**

Run: `docker exec -i $(docker ps -q -f name=postgres) psql -U postgres -d crm -c "\d contacts"` and `"\d companies"` and `"\d user_favorites"` and `"\d user_settings"`
Expected: New columns and tables visible.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/database/migrations/1712000000000-V03SchemaChanges.ts
git commit -m "feat: v0.3 database migration — lifecycle stage on companies, created_by_id, favorites, settings tables"
```

---

## Task 2: Backend Entities for New Tables

**Files:**
- Create: `apps/api/src/modules/crm/entities/user-favorite.entity.ts`
- Create: `apps/api/src/modules/crm/entities/user-setting.entity.ts`
- Modify: `apps/api/src/modules/crm/entities/contact.entity.ts`
- Modify: `apps/api/src/modules/crm/entities/company.entity.ts`
- Modify: `apps/api/src/modules/crm/entities/index.ts`

- [ ] **Step 1: Create UserFavorite entity**

```typescript
// apps/api/src/modules/crm/entities/user-favorite.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique, Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_favorites')
@Unique(['userId', 'entityType', 'entityId'])
@Index('idx_user_favorites_user_entity', ['userId', 'entityType'])
export class UserFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'entity_type' })
  entityType: string; // 'contact' | 'company'

  @Column({ name: 'entity_id' })
  entityId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

- [ ] **Step 2: Create UserSetting entity**

```typescript
// apps/api/src/modules/crm/entities/user-setting.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
@Unique(['userId', 'section'])
export class UserSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  section: string;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

- [ ] **Step 3: Update Contact entity**

In `apps/api/src/modules/crm/entities/contact.entity.ts`:
- Remove the `lifecycleStage` column
- Add `createdById` column (uuid, nullable, FK to users)
- Add `companyId` column (uuid, nullable, FK to companies)
- Add relation for `createdBy` (ManyToOne → User)
- Add relation for `company` (ManyToOne → Company)

- [ ] **Step 4: Update Company entity**

In `apps/api/src/modules/crm/entities/company.entity.ts`:
- Add `lifecycleStage` column (varchar, default 'lead')
- Add `createdById` column (uuid, nullable, FK to users)
- Add relation for `createdBy` (ManyToOne → User)

- [ ] **Step 5: Update entity index barrel export**

In `apps/api/src/modules/crm/entities/index.ts`, add:
```typescript
export { UserFavorite } from './user-favorite.entity';
export { UserSetting } from './user-setting.entity';
```

- [ ] **Step 6: Register new entities in CRM module**

In `apps/api/src/modules/crm/crm.module.ts`, add `UserFavorite` and `UserSetting` to the `TypeOrmModule.forFeature([...])` array.

- [ ] **Step 7: Verify TypeScript compilation**

Run: `cd apps/api && pnpm build`
Expected: No compilation errors.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/crm/entities/ apps/api/src/modules/crm/crm.module.ts
git commit -m "feat: add UserFavorite, UserSetting entities; update Contact/Company for v0.3 schema"
```

---

## Task 3: Backend — Contact Search Fix (Full Name)

**Files:**
- Modify: `apps/api/src/modules/crm/services/contacts.service.ts`
- Modify: `apps/api/src/modules/crm/services/search.service.ts`

**v0.3 requirement:** "Contact search does not work when you put First Name + ' ' + Last Name"

- [ ] **Step 1: Fix contacts.service.ts findAll search**

In `contacts.service.ts`, replace the existing search block (the ILIKE OR clause) with:

```typescript
if (filters.search) {
  const search = filters.search.trim();
  const parts = search.split(/\s+/);
  if (parts.length >= 2) {
    // Multi-word: match first part against firstName AND remaining against lastName
    qb.andWhere(
      '(contact.firstName ILIKE :first AND contact.lastName ILIKE :last) OR contact.email ILIKE :search OR contact.phone ILIKE :search',
      {
        first: `%${parts[0]}%`,
        last: `%${parts.slice(1).join(' ')}%`,
        search: `%${search}%`,
      },
    );
  } else {
    qb.andWhere(
      '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search OR contact.phone ILIKE :search)',
      { search: `%${search}%` },
    );
  }
}
```

- [ ] **Step 2: Fix search.service.ts searchContacts**

In `search.service.ts`, update the `searchContacts` method's WHERE clause similarly — split query on spaces and match `first_name ILIKE first-part AND last_name ILIKE second-part` as an additional OR branch:

```typescript
private async searchContacts(tenantId: string, pattern: string, limit: number) {
  const query = pattern.replace(/%/g, '').trim();
  const parts = query.split(/\s+/);

  let whereClause: string;
  let params: Record<string, any>;

  if (parts.length >= 2) {
    whereClause = `c.tenant_id = :tenantId AND (
      (c.first_name ILIKE :first AND c.last_name ILIKE :last)
      OR c.email ILIKE :pattern
      OR c.phone ILIKE :pattern
    )`;
    params = {
      tenantId,
      first: `%${parts[0]}%`,
      last: `%${parts.slice(1).join(' ')}%`,
      pattern,
    };
  } else {
    whereClause = `c.tenant_id = :tenantId AND (c.first_name ILIKE :pattern OR c.last_name ILIKE :pattern OR c.email ILIKE :pattern OR c.phone ILIKE :pattern)`;
    params = { tenantId, pattern };
  }

  // ... rest of query using whereClause and params
}
```

- [ ] **Step 3: Test locally**

Start the app with `./start.sh`. In the UI or via curl, search for a contact by "FirstName LastName" and confirm results appear.

Run: `curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/v1/contacts?search=John+Doe" | jq '.data | length'`
Expected: Non-zero result count.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/crm/services/contacts.service.ts apps/api/src/modules/crm/services/search.service.ts
git commit -m "fix: contact search now matches full name (firstName + lastName)"
```

---

## Task 4: Backend — Contact & Company DTOs Update

**Files:**
- Modify: `apps/api/src/modules/crm/dto/create-contact.dto.ts`
- Modify: `apps/api/src/modules/crm/dto/contact-filter.dto.ts`
- Modify: `apps/api/src/modules/crm/dto/create-company.dto.ts`
- Modify: `apps/api/src/modules/crm/dto/company-filter.dto.ts`

- [ ] **Step 1: Update CreateContactDto**

- Remove `lifecycleStage` field
- Add `companyId` as required UUID field (`@IsUUID()`, `@IsNotEmpty()`)
- Keep `companyIds` as optional (for additional company associations)

- [ ] **Step 2: Update ContactFilterDto**

- Remove `lifecycleStage` filter
- Add `favorite` optional boolean filter
- Expand search to note it covers name, company, email, phone, deal name (actual expansion is in service)

- [ ] **Step 3: Update CreateCompanyDto**

- Add `lifecycleStage` as optional string (default handled by DB)

- [ ] **Step 4: Update CompanyFilterDto**

- Add `lifecycleStage` optional string filter
- Add `favorite` optional boolean filter

- [ ] **Step 5: Verify compilation**

Run: `cd apps/api && pnpm build`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/crm/dto/
git commit -m "feat: update DTOs — companyId required on contacts, lifecycle stage on companies, favorite filter"
```

---

## Task 5: Backend — Contact & Company Service Updates

**Files:**
- Modify: `apps/api/src/modules/crm/services/contacts.service.ts`
- Modify: `apps/api/src/modules/crm/services/companies.service.ts`
- Modify: `apps/api/src/modules/crm/controllers/contacts.controller.ts`
- Modify: `apps/api/src/modules/crm/controllers/companies.controller.ts`

- [ ] **Step 1: Update contacts.service.ts create method**

- Auto-set `createdById` from the current user ID (pass userId into create method)
- Set `companyId` from DTO
- After creating contact, auto-create `ContactCompany` association if `companyId` provided
- Remove `lifecycleStage` from create logic

- [ ] **Step 2: Update contacts.service.ts findAll method**

- Remove `lifecycleStage` filter
- Add left join to companies to load `company` relation
- Add left join to `user_favorites` for favorite filtering
- Expand search to include company name: `LEFT JOIN companies comp ON comp.id = contact.companyId` then `OR comp.name ILIKE :search`
- Add `createdBy` relation loading (left join users)

- [ ] **Step 3: Update contacts.controller.ts**

- Pass `user.id` to `create()` method for `createdById`
- Add `totalCount` to response (for record count feature — count without filters)

- [ ] **Step 4: Update companies.service.ts**

- Auto-set `createdById` from current user on create
- Add `lifecycleStage` filter to findAll
- Add favorite filtering via left join to `user_favorites`
- Expand search to include phone
- Add `createdBy` relation loading

- [ ] **Step 5: Update companies.controller.ts**

- Pass `user.id` to `create()` for `createdById`
- Add `totalCount` to response

- [ ] **Step 6: Test API endpoints**

Run the app and verify:
```bash
# Create contact with required companyId
curl -X POST http://localhost:3001/api/v1/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","companyId":"<company-uuid>"}'

# Verify response includes createdBy and company
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/v1/contacts?limit=1" | jq '.data[0] | {createdBy, company}'
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/crm/services/ apps/api/src/modules/crm/controllers/
git commit -m "feat: contacts require company, auto-set createdById, lifecycle stage on companies"
```

---

## Task 6: Backend — Favorites API

**Files:**
- Create: `apps/api/src/modules/crm/dto/create-favorite.dto.ts`
- Create: `apps/api/src/modules/crm/services/favorites.service.ts`
- Create: `apps/api/src/modules/crm/controllers/favorites.controller.ts`
- Modify: `apps/api/src/modules/crm/crm.module.ts`

- [ ] **Step 1: Create DTO**

```typescript
// apps/api/src/modules/crm/dto/create-favorite.dto.ts
import { IsUUID, IsIn } from 'class-validator';

export class CreateFavoriteDto {
  @IsIn(['contact', 'company'])
  entityType: string;

  @IsUUID()
  entityId: string;
}
```

- [ ] **Step 2: Create FavoritesService**

```typescript
// apps/api/src/modules/crm/services/favorites.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from '../entities/user-favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavorite)
    private readonly favRepo: Repository<UserFavorite>,
  ) {}

  async toggle(tenantId: string, userId: string, entityType: string, entityId: string) {
    const existing = await this.favRepo.findOne({
      where: { userId, entityType, entityId },
    });
    if (existing) {
      await this.favRepo.remove(existing);
      return { favorited: false };
    }
    const fav = this.favRepo.create({ tenantId, userId, entityType, entityId });
    await this.favRepo.save(fav);
    return { favorited: true };
  }

  async findAll(tenantId: string, userId: string, entityType: string) {
    return this.favRepo.find({
      where: { tenantId, userId, entityType },
      order: { createdAt: 'DESC' },
    });
  }

  async isFavorited(userId: string, entityType: string, entityId: string) {
    const count = await this.favRepo.count({
      where: { userId, entityType, entityId },
    });
    return count > 0;
  }

  async getFavoriteIds(userId: string, entityType: string): Promise<string[]> {
    const favs = await this.favRepo.find({
      where: { userId, entityType },
      select: ['entityId'],
    });
    return favs.map(f => f.entityId);
  }
}
```

- [ ] **Step 3: Create FavoritesController**

```typescript
// apps/api/src/modules/crm/controllers/favorites.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { FavoritesService } from '../services/favorites.service';
import { CreateFavoriteDto } from '../dto/create-favorite.dto';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle')
  async toggle(@CurrentUser() user: any, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.toggle(user.tenantId, user.id, dto.entityType, dto.entityId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('entityType') entityType: string,
  ) {
    return this.favoritesService.findAll(user.tenantId, user.id, entityType);
  }
}
```

- [ ] **Step 4: Register in CRM module**

Add `FavoritesService` to providers and `FavoritesController` to controllers in `crm.module.ts`.

- [ ] **Step 5: Test favorites API**

```bash
# Toggle favorite
curl -X POST http://localhost:3001/api/v1/favorites/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"entityType":"contact","entityId":"<contact-uuid>"}'
# Expected: { "favorited": true }

# Toggle again (unfavorite)
# Expected: { "favorited": false }

# List favorites
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/v1/favorites?entityType=contact"
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/crm/dto/create-favorite.dto.ts \
  apps/api/src/modules/crm/services/favorites.service.ts \
  apps/api/src/modules/crm/controllers/favorites.controller.ts \
  apps/api/src/modules/crm/crm.module.ts
git commit -m "feat: favorites API — toggle, list favorites for contacts and companies"
```

---

## Task 7: Backend — User Settings API

**Files:**
- Create: `apps/api/src/modules/crm/dto/user-setting.dto.ts`
- Create: `apps/api/src/modules/crm/services/user-settings.service.ts`
- Create: `apps/api/src/modules/crm/controllers/user-settings.controller.ts`

- [ ] **Step 1: Create DTO**

```typescript
// apps/api/src/modules/crm/dto/user-setting.dto.ts
import { IsString, IsObject } from 'class-validator';

export class UpsertUserSettingDto {
  @IsString()
  section: string;

  @IsObject()
  settings: Record<string, any>;
}
```

- [ ] **Step 2: Create UserSettingsService**

```typescript
// apps/api/src/modules/crm/services/user-settings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting } from '../entities/user-setting.entity';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSetting)
    private readonly repo: Repository<UserSetting>,
  ) {}

  async get(userId: string, section: string): Promise<Record<string, any>> {
    const setting = await this.repo.findOne({ where: { userId, section } });
    return setting?.settings ?? {};
  }

  async upsert(tenantId: string, userId: string, section: string, settings: Record<string, any>) {
    const existing = await this.repo.findOne({ where: { userId, section } });
    if (existing) {
      existing.settings = { ...existing.settings, ...settings };
      return this.repo.save(existing);
    }
    const entity = this.repo.create({ tenantId, userId, section, settings });
    return this.repo.save(entity);
  }
}
```

- [ ] **Step 3: Create UserSettingsController**

```typescript
// apps/api/src/modules/crm/controllers/user-settings.controller.ts
import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { UserSettingsService } from '../services/user-settings.service';
import { UpsertUserSettingDto } from '../dto/user-setting.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/user-settings')
export class UserSettingsController {
  constructor(private readonly settingsService: UserSettingsService) {}

  @Get(':section')
  async get(@CurrentUser() user: any, @Param('section') section: string) {
    return this.settingsService.get(user.id, section);
  }

  @Put(':section')
  async upsert(
    @CurrentUser() user: any,
    @Param('section') section: string,
    @Body() dto: UpsertUserSettingDto,
  ) {
    return this.settingsService.upsert(user.tenantId, user.id, section, dto.settings);
  }
}
```

- [ ] **Step 4: Register in CRM module**

Add `UserSettingsService` to providers and `UserSettingsController` to controllers.

- [ ] **Step 5: Test**

```bash
curl -X PUT http://localhost:3001/api/v1/user-settings/pipelines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section":"pipelines","settings":{"cardFields":["name","amount","lifecycleStage","company","owner"]}}'

curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/v1/user-settings/pipelines"
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/crm/dto/user-setting.dto.ts \
  apps/api/src/modules/crm/services/user-settings.service.ts \
  apps/api/src/modules/crm/controllers/user-settings.controller.ts \
  apps/api/src/modules/crm/crm.module.ts
git commit -m "feat: user settings API — per-section JSON settings storage"
```

---

## Task 8: Backend — Expanded Search Scope

**Files:**
- Modify: `apps/api/src/modules/crm/services/contacts.service.ts`
- Modify: `apps/api/src/modules/crm/services/companies.service.ts`

**v0.3 requirement:** Contact search should cover name, company, email, phone, associated deal name. Company search should cover name, email, phone, associated deal name.

- [ ] **Step 1: Expand contact search in findAll**

Add left joins to companies (via company_id) and deals (via company_id or direct association), then add their fields to the ILIKE OR clause:

```typescript
// In findAll, after the base query setup:
qb.leftJoin('companies', 'comp', 'comp.id = contact.companyId');
qb.leftJoin('deals', 'deal', 'deal.companyId = comp.id AND deal.tenantId = :tenantId');

// In the search clause, add: OR comp.name ILIKE :search OR deal.name ILIKE :search
```

- [ ] **Step 2: Expand company search in findAll**

Add left join to deals via company_id, then add deal.name to the ILIKE OR clause:

```typescript
qb.leftJoin('deals', 'deal', 'deal.companyId = company.id AND deal.tenantId = :tenantId');

// In search clause, add: OR company.phone ILIKE :search OR deal.name ILIKE :search
```

- [ ] **Step 3: Test expanded search**

```bash
# Search contacts by company name
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/v1/contacts?search=Acme" | jq '.data | length'

# Search companies by deal name
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/v1/companies?search=Enterprise+Deal" | jq '.data | length'
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/crm/services/contacts.service.ts apps/api/src/modules/crm/services/companies.service.ts
git commit -m "feat: expand search scope — contacts search by company/deal/phone, companies search by deal/phone"
```

---

## Task 9: Frontend — Shared Phone Components

**Files:**
- Create: `apps/web/src/components/ui/phone-input.tsx`
- Create: `apps/web/src/components/ui/phone-display.tsx`

- [ ] **Step 1: Create PhoneDisplay component**

Formats E.164 phone numbers to `+1-(xxx)-xxx-xxxx` display format. Falls back to raw string if not parseable.

```typescript
// apps/web/src/components/ui/phone-display.tsx
'use client';

const COUNTRY_CODES: Record<string, { flag: string; code: string }> = {
  '1': { flag: '🇺🇸', code: '+1' },
  '44': { flag: '🇬🇧', code: '+44' },
  '61': { flag: '🇦🇺', code: '+61' },
  '33': { flag: '🇫🇷', code: '+33' },
  '49': { flag: '🇩🇪', code: '+49' },
  '81': { flag: '🇯🇵', code: '+81' },
  '86': { flag: '🇨🇳', code: '+86' },
  '91': { flag: '🇮🇳', code: '+91' },
  '55': { flag: '🇧🇷', code: '+55' },
  '52': { flag: '🇲🇽', code: '+52' },
};

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  // US/CA number: +1-(xxx)-xxx-xxxx
  if (digits.length === 11 && digits.startsWith('1')) {
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `+1-(${area})-${prefix}-${line}`;
  }
  if (digits.length === 10) {
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);
    return `+1-(${area})-${prefix}-${line}`;
  }
  // Return as-is with + prefix if not already
  return phone.startsWith('+') ? phone : `+${phone}`;
}

export function PhoneDisplay({ phone }: { phone: string | null | undefined }) {
  return <span>{formatPhoneNumber(phone)}</span>;
}
```

- [ ] **Step 2: Create PhoneInput component**

Country code selector with emoji flags + phone number input field.

```typescript
// apps/web/src/components/ui/phone-input.tsx
'use client';

import { useState } from 'react';
import { Input } from './input';

const COUNTRIES = [
  { code: '1', flag: '🇺🇸', name: 'US', label: '🇺🇸 +1' },
  { code: '1', flag: '🇨🇦', name: 'CA', label: '🇨🇦 +1' },
  { code: '44', flag: '🇬🇧', name: 'UK', label: '🇬🇧 +44' },
  { code: '61', flag: '🇦🇺', name: 'AU', label: '🇦🇺 +61' },
  { code: '33', flag: '🇫🇷', name: 'FR', label: '🇫🇷 +33' },
  { code: '49', flag: '🇩🇪', name: 'DE', label: '🇩🇪 +49' },
  { code: '81', flag: '🇯🇵', name: 'JP', label: '🇯🇵 +81' },
  { code: '86', flag: '🇨🇳', name: 'CN', label: '🇨🇳 +86' },
  { code: '91', flag: '🇮🇳', name: 'IN', label: '🇮🇳 +91' },
  { code: '55', flag: '🇧🇷', name: 'BR', label: '🇧🇷 +55' },
  { code: '52', flag: '🇲🇽', name: 'MX', label: '🇲🇽 +52' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PhoneInput({ value, onChange, placeholder = '(555) 000-0000' }: PhoneInputProps) {
  // Parse existing value to extract country code
  const parsed = parsePhoneValue(value);
  const [countryIdx, setCountryIdx] = useState(parsed.countryIdx);

  function parsePhoneValue(val: string) {
    if (!val) return { countryIdx: 0, number: '' };
    const digits = val.replace(/\D/g, '');
    // Try to match country code
    for (let i = 0; i < COUNTRIES.length; i++) {
      if (digits.startsWith(COUNTRIES[i].code) && COUNTRIES[i].code !== '1') {
        return { countryIdx: i, number: digits.slice(COUNTRIES[i].code.length) };
      }
    }
    // Default US +1
    if (digits.startsWith('1') && digits.length > 10) {
      return { countryIdx: 0, number: digits.slice(1) };
    }
    return { countryIdx: 0, number: digits };
  }

  function handleNumberChange(num: string) {
    const digits = num.replace(/\D/g, '');
    const full = `+${COUNTRIES[countryIdx].code}${digits}`;
    onChange(full);
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = parseInt(e.target.value);
    setCountryIdx(idx);
    const digits = parsed.number;
    const full = `+${COUNTRIES[idx].code}${digits}`;
    onChange(full);
  }

  return (
    <div className="flex gap-2">
      <select
        value={countryIdx}
        onChange={handleCountryChange}
        className="h-10 rounded-md border border-input bg-background px-2 text-sm"
      >
        {COUNTRIES.map((c, i) => (
          <option key={`${c.name}-${i}`} value={i}>{c.label}</option>
        ))}
      </select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={parsed.number}
        onChange={(e) => handleNumberChange(e.target.value)}
        className="flex-1"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify components render**

Start the app and temporarily add `<PhoneDisplay phone="+15551234567" />` and `<PhoneInput value="" onChange={console.log} />` to any page to verify rendering.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ui/phone-input.tsx apps/web/src/components/ui/phone-display.tsx
git commit -m "feat: shared phone display (+1-(xxx)-xxx-xxxx) and phone input (country code selector) components"
```

---

## Task 10: Frontend — FilterBar Components

**Files:**
- Create: `apps/web/src/components/filter-bar/filter-bar.tsx`
- Create: `apps/web/src/components/filter-bar/filter-pill.tsx`
- Create: `apps/web/src/components/filter-bar/filter-popover.tsx`

This is the unified search + filter component used by both Contacts and Companies pages.

- [ ] **Step 1: Create FilterPill component**

Small pill showing "Field: Value" with an "x" on hover to remove.

```typescript
// apps/web/src/components/filter-bar/filter-pill.tsx
'use client';

import { X } from 'lucide-react';

interface FilterPillProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterPill({ label, value, onRemove }: FilterPillProps) {
  return (
    <span className="group inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
      <span className="text-muted-foreground">{label}:</span>
      <span>{value}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 hidden rounded-full p-0.5 hover:bg-destructive/20 group-hover:inline-flex"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
```

- [ ] **Step 2: Create FilterPopover component**

Popover that lists available schema fields. User selects a field, enters a value, clicks "Filter" to apply.

```typescript
// apps/web/src/components/filter-bar/filter-popover.tsx
'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'boolean';
  options?: { label: string; value: string }[];
}

interface FilterPopoverProps {
  fields: FilterField[];
  onApply: (key: string, value: string, label: string) => void;
}

export function FilterPopover({ fields, onApply }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FilterField | null>(null);
  const [filterValue, setFilterValue] = useState('');

  function handleApply() {
    if (!selectedField || !filterValue) return;
    onApply(selectedField.key, filterValue, selectedField.label);
    setSelectedField(null);
    setFilterValue('');
    setOpen(false);
  }

  function handleFieldSelect(field: FilterField) {
    setSelectedField(field);
    setFilterValue('');
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => { setOpen(!open); setSelectedField(null); setFilterValue(''); }}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-background p-4 shadow-lg">
          {!selectedField ? (
            <div className="space-y-1">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Filter by field</p>
              {fields.map((field) => (
                <button
                  key={field.key}
                  onClick={() => handleFieldSelect(field)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {field.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">{selectedField.label}</Label>
              {selectedField.type === 'select' && selectedField.options ? (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  {selectedField.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : selectedField.type === 'date' ? (
                <Input
                  type="date"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              ) : selectedField.type === 'boolean' ? (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select...</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              ) : (
                <Input
                  placeholder={`Enter ${selectedField.label.toLowerCase()}...`}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                />
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedField(null)}>Back</Button>
                <Button size="sm" onClick={handleApply} disabled={!filterValue}>Filter</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create FilterBar component**

Combines search input + filter popover + pill display.

```typescript
// apps/web/src/components/filter-bar/filter-bar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { FilterPopover, FilterField } from './filter-popover';
import { FilterPill } from './filter-pill';

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
}

interface FilterBarProps {
  fields: FilterField[];
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: ActiveFilter[]) => void;
  searchPlaceholder?: string;
  initialSearch?: string;
  initialFilters?: ActiveFilter[];
}

export function FilterBar({
  fields,
  onSearchChange,
  onFiltersChange,
  searchPlaceholder = 'Search...',
  initialSearch = '',
  initialFilters = [],
}: FilterBarProps) {
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<ActiveFilter[]>(initialFilters);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => onSearchChange(search), 300);
    return () => clearTimeout(t);
  }, [search, onSearchChange]);

  function addFilter(key: string, value: string, label: string) {
    const next = [...filters.filter(f => f.key !== key), { key, value, label }];
    setFilters(next);
    onFiltersChange(next);
  }

  function removeFilter(key: string) {
    const next = filters.filter(f => f.key !== key);
    setFilters(next);
    onFiltersChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <FilterPopover fields={fields} onApply={addFilter} />
      </div>
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              value={f.value}
              onRemove={() => removeFilter(f.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export type { FilterField };
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/filter-bar/
git commit -m "feat: FilterBar component — search input, filter popover, filter pills"
```

---

## Task 11: Frontend — SortableTableHeader, ColumnPicker, RecordCount, FavoriteButton

**Files:**
- Create: `apps/web/src/components/sortable-table-header.tsx`
- Create: `apps/web/src/components/column-picker.tsx`
- Create: `apps/web/src/components/record-count.tsx`
- Create: `apps/web/src/components/favorite-button.tsx`
- Create: `apps/web/src/hooks/use-favorites.ts`

- [ ] **Step 1: Create SortableTableHeader**

```typescript
// apps/web/src/components/sortable-table-header.tsx
'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: 'ASC' | 'DESC';
  onSort: (field: string, order: 'ASC' | 'DESC') => void;
  className?: string;
}

export function SortableTableHeader({
  label, field, currentSort, currentOrder, onSort, className = '',
}: SortableTableHeaderProps) {
  const isActive = currentSort === field;

  function handleClick() {
    if (isActive) {
      onSort(field, currentOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      onSort(field, 'ASC');
    }
  }

  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentOrder === 'ASC' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );
}
```

- [ ] **Step 2: Create ColumnPicker**

```typescript
// apps/web/src/components/column-picker.tsx
'use client';

import { useState } from 'react';
import { Columns3 } from 'lucide-react';
import { Button } from './ui/button';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnPickerProps {
  columns: ColumnDef[];
  visibleColumns: string[];
  onChange: (visibleColumns: string[]) => void;
}

export function ColumnPicker({ columns, visibleColumns, onChange }: ColumnPickerProps) {
  const [open, setOpen] = useState(false);

  function toggleColumn(key: string) {
    if (visibleColumns.includes(key)) {
      onChange(visibleColumns.filter(k => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Columns3 className="mr-1 h-4 w-4" />
        Columns
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-background p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Toggle columns</p>
          {columns.map((col) => (
            <label key={col.key} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
                className="rounded"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create RecordCount**

```typescript
// apps/web/src/components/record-count.tsx
'use client';

export function RecordCount({
  filtered,
  total,
  hasFilters,
}: {
  filtered: number;
  total: number;
  hasFilters: boolean;
}) {
  return (
    <span className="text-sm text-muted-foreground">
      {hasFilters
        ? `${filtered.toLocaleString()} records of ${total.toLocaleString()} total`
        : `${total.toLocaleString()} records`}
    </span>
  );
}
```

- [ ] **Step 4: Create FavoriteButton**

```typescript
// apps/web/src/components/favorite-button.tsx
'use client';

import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
}

export function FavoriteButton({ isFavorite, onToggle }: FavoriteButtonProps) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="p-1 hover:scale-110 transition-transform"
    >
      <Star
        className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
      />
    </button>
  );
}
```

- [ ] **Step 5: Create use-favorites hook**

```typescript
// apps/web/src/hooks/use-favorites.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useFavorites(entityType: 'contact' | 'company') {
  return useQuery({
    queryKey: ['favorites', entityType],
    queryFn: () => apiClient.get(`/api/v1/favorites?entityType=${entityType}`),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string }) =>
      apiClient.post('/api/v1/favorites/toggle', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', variables.entityType] });
    },
  });
}
```

- [ ] **Step 6: Create use-user-settings hook**

```typescript
// apps/web/src/hooks/use-user-settings.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useUserSettings(section: string) {
  return useQuery({
    queryKey: ['user-settings', section],
    queryFn: () => apiClient.get(`/api/v1/user-settings/${section}`),
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { section: string; settings: Record<string, any> }) =>
      apiClient.put(`/api/v1/user-settings/${data.section}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', variables.section] });
    },
  });
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/sortable-table-header.tsx \
  apps/web/src/components/column-picker.tsx \
  apps/web/src/components/record-count.tsx \
  apps/web/src/components/favorite-button.tsx \
  apps/web/src/hooks/use-favorites.ts \
  apps/web/src/hooks/use-user-settings.ts
git commit -m "feat: shared UI components — sortable headers, column picker, record count, favorite button"
```

---

## Task 12: Frontend — Contacts Page Redesign

**Files:**
- Modify: `apps/web/src/app/(dashboard)/contacts/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/contacts/components/contacts-table.tsx`
- Modify: `apps/web/src/app/(dashboard)/contacts/components/contact-form.tsx`
- Modify: `apps/web/src/app/(dashboard)/contacts/[id]/page.tsx`
- Modify: `apps/web/src/hooks/use-contacts.ts`

- [ ] **Step 1: Update Contact interface and hooks**

In `use-contacts.ts`:
- Remove `lifecycleStage` from `Contact` interface
- Add `createdById: string | null`, `createdBy: { firstName: string; lastName: string } | null`
- Add `companyId: string` (required), `company: { id: string; name: string; lifecycleStage: string } | null`
- Add `totalCount` to `ContactsResponse` meta
- Remove `lifecycleStage` from `ContactFilters`
- Add `favorite?: boolean` to `ContactFilters`

- [ ] **Step 2: Rewrite contacts/page.tsx**

Replace the entire page with new layout:
- Remove all hardcoded filter dropdowns
- Add `FilterBar` with contact schema fields (firstName, lastName, email, phone, company, leadStatus, createdBy, tags, createdAfter, createdBefore)
- Add `RecordCount` next to "Contacts" header
- Add `ColumnPicker` button
- Add saved filter management (save/load from SavedView)
- Move "Cancel" button next to "Create Contact" in the create form section

Key structure:
```tsx
<div className="space-y-4 p-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h1 className="text-2xl font-bold">Contacts</h1>
      <RecordCount filtered={data?.meta.total} total={data?.meta.totalCount} hasFilters={hasActiveFilters} />
    </div>
    <div className="flex items-center gap-2">
      <ColumnPicker columns={CONTACT_COLUMNS} visibleColumns={visibleCols} onChange={setVisibleCols} />
      {/* Save View button */}
      <Button onClick={() => setShowCreate(!showCreate)}>
        {showCreate ? 'Cancel' : 'Create Contact'}
      </Button>
    </div>
  </div>
  <FilterBar fields={CONTACT_FILTER_FIELDS} onSearchChange={setSearch} onFiltersChange={setFilters}
    searchPlaceholder="Search by name, company, email, phone, or deal..." />
  {showCreate && <ContactForm onSuccess={...} onCancel={() => setShowCreate(false)} />}
  <ContactsTable contacts={data?.data} visibleColumns={visibleCols} sort={sort} order={order} onSort={handleSort}
    favoriteIds={favoriteIds} onToggleFavorite={handleToggleFavorite} />
  {/* Pagination */}
</div>
```

- [ ] **Step 3: Rewrite contacts-table.tsx**

- Accept `visibleColumns`, `sort`, `order`, `onSort`, `favoriteIds`, `onToggleFavorite` as props
- Use `SortableTableHeader` for all column headers
- Only render columns that are in `visibleColumns`
- Show `FavoriteButton` as first column
- Display `PhoneDisplay` for phone column
- Show "Created By" as `createdBy?.firstName + ' ' + createdBy?.lastName` or "System"
- Show Company name from `contact.company?.name`
- Show Lifecycle Stage from `contact.company?.lifecycleStage`

- [ ] **Step 4: Update contact-form.tsx**

- Remove `lifecycleStage` field
- Add required `companyId` field with entity search (similar to deal form's company picker)
- Place "Cancel" button to the left of "Create Contact" button in the footer
- Use `PhoneInput` component for phone field

- [ ] **Step 5: Update contact detail page**

In `contacts/[id]/page.tsx`:
- Show "Created By" instead of "Owner"
- Display `PhoneDisplay` for phone
- Show company info with lifecycle stage (from company)
- Add `FavoriteButton`

- [ ] **Step 6: Implement saved filter groups**

Add a "Save View" button that opens a dialog to name and save current filters. Add a dropdown next to the filter bar to quickly load saved views. Use existing `useSavedViews` and `useCreateView` hooks with `objectType: 'contact'`.

The "Favorites" view should be auto-created: a saved view with name "Favorites" and filter `{ favorite: 'true' }`.

- [ ] **Step 7: Test all contact requirements**

Start the app and verify each v0.3 item:
1. Search "First Last" returns results
2. Phone displays as +1-(xxx)-xxx-xxxx
3. Company field on every contact
4. Lifecycle stage from company (read-only on contact)
5. "Created By" shows name, fallback "System"
6. Filter bar with pills, popup, add/remove
7. Search covers name, company, email, phone, deal
8. Cancel button next to Create Contact
9. Sort by any column
10. Add/remove columns
11. Save/load filter groups
12. Record count display
13. Star/favorite contacts

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/contacts/ apps/web/src/hooks/use-contacts.ts
git commit -m "feat: contacts page redesign — filter bar, sorting, columns, favorites, phone formatting, created by"
```

---

## Task 13: Frontend — Companies Page Redesign

**Files:**
- Modify: `apps/web/src/app/(dashboard)/companies/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/companies/components/companies-table.tsx`
- Modify: `apps/web/src/app/(dashboard)/companies/components/company-form.tsx`
- Modify: `apps/web/src/app/(dashboard)/companies/[id]/page.tsx`
- Modify: `apps/web/src/hooks/use-companies.ts`

Same pattern as Task 12 but for companies.

- [ ] **Step 1: Update Company interface and hooks**

In `use-companies.ts`:
- Add `lifecycleStage: string` to Company interface
- Add `createdById: string | null`, `createdBy: { firstName: string; lastName: string } | null`
- Add `totalCount` to response meta
- Add `lifecycleStage`, `favorite` to CompanyFilters

- [ ] **Step 2: Rewrite companies/page.tsx**

Same structure as contacts page:
- FilterBar with company schema fields (name, domain, industry, size, phone, lifecycleStage, createdBy, createdAfter, createdBefore)
- RecordCount, ColumnPicker, saved views
- Cancel next to Create Company

- [ ] **Step 3: Rewrite companies-table.tsx**

- SortableTableHeader for all columns
- Dynamic visible columns
- FavoriteButton, PhoneDisplay
- "Created By" column
- Lifecycle Stage badge column

- [ ] **Step 4: Update company-form.tsx**

- Add `lifecycleStage` dropdown field
- Use `PhoneInput` for phone
- Cancel button placement

- [ ] **Step 5: Update company detail page**

- Lifecycle stage display
- PhoneDisplay
- Created By
- FavoriteButton

- [ ] **Step 6: Test all company requirements**

Verify each v0.3 company item mirrors the contacts requirements.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/companies/ apps/web/src/hooks/use-companies.ts
git commit -m "feat: companies page redesign — lifecycle stage, filter bar, sorting, columns, favorites, phone formatting"
```

---

## Task 14: Frontend — Deals → Pipelines Rename + Enhancements

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/app/(dashboard)/deals/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/deals/components/pipeline-board.tsx`
- Modify: `apps/web/src/hooks/use-deals.ts`
- Modify: `apps/web/src/hooks/use-user-settings.ts`

- [ ] **Step 1: Rename "Deals" to "Pipelines" in navigation**

In `layout.tsx`, change the Sales section nav item:
```typescript
{ label: 'Pipelines', href: '/deals', icon: Handshake }
```
Also update the page header in `deals/page.tsx` from "Deals" to "Pipelines".

- [ ] **Step 2: Add "All Opportunities" default pipeline**

In `deals/page.tsx`, add a virtual "All Opportunities" option to the pipeline dropdown:
- When selected, fetch deals across all pipelines (don't pass pipelineId to API)
- Show in list view (not board view, since stages differ across pipelines)
- Make it the default selection

- [ ] **Step 3: Implement card customization settings**

Use `useUserSettings('pipelines')` to load card field preferences. Default fields: `['name', 'amount', 'lifecycleStage', 'company', 'owner']`.

In `pipeline-board.tsx`, render card content based on user's field preferences instead of hardcoded fields. Read lifecycle stage from `deal.company.lifecycleStage`.

- [ ] **Step 4: Add card footer icons**

At the bottom of each card in `pipeline-board.tsx`, add three icons:

```tsx
<div className="flex items-center justify-between border-t pt-2 mt-2">
  {/* Calendar — next scheduled action */}
  <button onClick={() => toggleExpand(deal.id, 'calendar')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
    <CalendarDays className="h-3.5 w-3.5" />
    {deal.nextActionDate && <span>{formatShortDate(deal.nextActionDate)}</span>}
  </button>

  {/* Tasks — outstanding count */}
  <button onClick={() => toggleExpand(deal.id, 'tasks')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
    <CheckSquare className="h-3.5 w-3.5" />
    {deal.outstandingTaskCount > 0 && <span>{deal.outstandingTaskCount}</span>}
  </button>

  {/* Owner avatar */}
  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
    {deal.owner ? `${deal.owner.firstName[0]}${deal.owner.lastName[0]}` : '??'}
  </div>
</div>
```

- [ ] **Step 5: Implement inline card expansion**

When a footer icon is clicked, expand the card inline to show:

**Calendar expansion:** Shows next scheduled activity details (date, type, subject). If none, shows "No upcoming actions".

**Tasks expansion:**
- Outstanding tasks at top with checkboxes
- "Add Task" button that creates a new unchecked task inline
- Completed tasks below with filled checkboxes
- Uses existing activities API (type: 'task') to load/update tasks

```tsx
{expandedCard === deal.id && expandedSection === 'tasks' && (
  <div className="mt-2 border-t pt-2 space-y-1">
    {outstandingTasks.map(task => (
      <label key={task.id} className="flex items-center gap-2 text-xs">
        <input type="checkbox" onChange={() => completeTask(task.id)} />
        {task.subject}
      </label>
    ))}
    <button onClick={() => addTask(deal.id)} className="text-xs text-primary hover:underline">
      + Add Task
    </button>
    {completedTasks.map(task => (
      <label key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground line-through">
        <input type="checkbox" checked disabled />
        {task.subject}
      </label>
    ))}
  </div>
)}
```

- [ ] **Step 6: Test pipeline requirements**

1. Nav shows "Pipelines" not "Deals"
2. Multiple pipelines selectable from dropdown
3. "All Opportunities" default shows all deals
4. Card customization works from settings
5. Card footer: calendar icon with date, task count with checkbox list, owner avatar
6. Inline expansion for calendar and tasks

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/deals/ apps/web/src/app/\(dashboard\)/layout.tsx apps/web/src/hooks/use-deals.ts
git commit -m "feat: rename Deals to Pipelines, add All Opportunities view, card customization, footer icons with inline expand"
```

---

## Task 15: Frontend — Settings Pages

**Files:**
- Create: `apps/web/src/app/(dashboard)/settings/layout.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/contacts/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/companies/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/pipelines/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/marketing/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/service/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/content/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/commerce/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/data/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/users/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/account/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create settings layout with sidebar nav**

```typescript
// apps/web/src/app/(dashboard)/settings/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SETTINGS_NAV = [
  { section: 'General', items: [
    { label: 'Account', href: '/settings/account' },
    { label: 'Users', href: '/settings/users' },
  ]},
  { section: 'Sections', items: [
    { label: 'Contacts', href: '/settings/contacts' },
    { label: 'Companies', href: '/settings/companies' },
    { label: 'Pipelines', href: '/settings/pipelines' },
    { label: 'Marketing', href: '/settings/marketing' },
    { label: 'Service', href: '/settings/service' },
    { label: 'Content', href: '/settings/content' },
    { label: 'Commerce', href: '/settings/commerce' },
    { label: 'Data & Analytics', href: '/settings/data' },
  ]},
  { section: 'Integrations', items: [
    { label: 'Integrations', href: '/settings/integrations' },
    { label: 'Lead Scoring', href: '/settings/lead-scoring' },
  ]},
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full">
      <nav className="w-56 shrink-0 border-r p-4 space-y-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        {SETTINGS_NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{group.section}</p>
            {group.items.map((item) => (
              <Link key={item.href} href={item.href}
                className={`block rounded-md px-3 py-1.5 text-sm ${
                  pathname === item.href ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                }`}
              >{item.label}</Link>
            ))}
          </div>
        ))}
      </nav>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create settings index page**

```typescript
// apps/web/src/app/(dashboard)/settings/page.tsx
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Choose a section from the sidebar to manage settings.</p>
    </div>
  );
}
```

- [ ] **Step 3: Create Pipelines settings page (card customization)**

This is the main populated settings page where users customize pipeline card fields.

```typescript
// apps/web/src/app/(dashboard)/settings/pipelines/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/use-user-settings';
import { Button } from '@/components/ui/button';

const AVAILABLE_FIELDS = [
  { key: 'name', label: 'Opportunity Name' },
  { key: 'amount', label: 'Value' },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'company', label: 'Company Name' },
  { key: 'owner', label: 'Opportunity Owner' },
  { key: 'closeDate', label: 'Close Date' },
  { key: 'priority', label: 'Priority' },
  { key: 'stage', label: 'Stage' },
  { key: 'probability', label: 'Probability' },
];

const DEFAULT_FIELDS = ['name', 'amount', 'lifecycleStage', 'company', 'owner'];

export default function PipelineSettingsPage() {
  const { data: settings } = useUserSettings('pipelines');
  const updateSettings = useUpdateUserSettings();
  const [cardFields, setCardFields] = useState<string[]>(DEFAULT_FIELDS);

  useEffect(() => {
    if (settings?.cardFields) setCardFields(settings.cardFields);
  }, [settings]);

  function toggleField(key: string) {
    setCardFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function handleSave() {
    updateSettings.mutate({ section: 'pipelines', settings: { cardFields } });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline Settings</h1>
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Card Display Fields</h2>
        <p className="text-sm text-muted-foreground">Choose which fields appear on pipeline cards.</p>
        <div className="space-y-2">
          {AVAILABLE_FIELDS.map(f => (
            <label key={f.key} className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50">
              <input type="checkbox" checked={cardFields.includes(f.key)} onChange={() => toggleField(f.key)} />
              <span className="text-sm">{f.label}</span>
            </label>
          ))}
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>Save Changes</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Account settings page**

```typescript
// apps/web/src/app/(dashboard)/settings/account/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <Card>
        <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Current Password</Label><Input type="password" /></div>
          <div><Label>New Password</Label><Input type="password" /></div>
          <div><Label>Confirm New Password</Label><Input type="password" /></div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create Users management page**

```typescript
// apps/web/src/app/(dashboard)/settings/users/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export default function UsersSettingsPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirst, setInviteFirst] = useState('');
  const [inviteLast, setInviteLast] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/api/v1/auth/users'),
  });

  const inviteUser = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInvite(false);
      setInviteEmail('');
      setInviteFirst('');
      setInviteLast('');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => setShowInvite(!showInvite)}>
          {showInvite ? 'Cancel' : 'Add User'}
        </Button>
      </div>
      {showInvite && (
        <Card>
          <CardHeader><CardTitle>Add New User</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>First Name</Label><Input value={inviteFirst} onChange={e => setInviteFirst(e.target.value)} /></div>
              <div><Label>Last Name</Label><Input value={inviteLast} onChange={e => setInviteLast(e.target.value)} /></div>
            </div>
            <div><Label>Email</Label><Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" /></div>
            <div>
              <Label>Role</Label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <Button onClick={() => inviteUser.mutate({
              email: inviteEmail, firstName: inviteFirst, lastName: inviteLast,
              password: 'TempPass123!', role: inviteRole,
            })} disabled={inviteUser.isPending}>Add User</Button>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3"><Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge></td>
                  <td className="px-4 py-3"><Button variant="ghost" size="sm">Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Create placeholder pages for other sections**

Create identical placeholder pages for: contacts, companies, marketing, service, content, commerce, data

Each follows this template:
```typescript
export default function XSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">X Settings</h1>
      <p className="mt-4 text-muted-foreground">Settings for this section are coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 7: Update sidebar navigation**

In `layout.tsx`, update the Settings section to link to the new settings hub:
```typescript
// Replace existing settings items with single entry
{ label: 'Settings', href: '/settings', icon: Settings }
```

- [ ] **Step 8: Test settings**

1. Settings sidebar navigation works for all sections
2. Pipeline card customization saves and persists
3. Account page shows user info
4. Users page lists users, can add new user
5. Placeholder pages render for undeveloped sections

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/settings/ apps/web/src/app/\(dashboard\)/layout.tsx
git commit -m "feat: settings hub — account, users, pipelines card config, placeholder pages for all sections"
```

---

## Task 16: Update Frontend Hooks for API Changes

**Files:**
- Modify: `apps/web/src/hooks/use-contacts.ts`
- Modify: `apps/web/src/hooks/use-companies.ts`

- [ ] **Step 1: Update use-contacts.ts**

Update the `Contact` interface to match new backend response:
- Remove `lifecycleStage` 
- Add `companyId`, `company` (with name and lifecycleStage), `createdById`, `createdBy`
- Update `ContactsResponse.meta` to include `totalCount`
- Update `CreateContactInput` to require `companyId` and remove `lifecycleStage`

- [ ] **Step 2: Update use-companies.ts**

Update the `Company` interface:
- Add `lifecycleStage`, `createdById`, `createdBy`
- Update `CompaniesResponse.meta` to include `totalCount`
- Update `CreateCompanyInput` to include `lifecycleStage`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/use-contacts.ts apps/web/src/hooks/use-companies.ts
git commit -m "feat: update frontend hooks for v0.3 API changes — lifecycle stage, createdBy, totalCount"
```

---

## Task 17: Final Verification & v0.3.md Checklist

- [ ] **Step 1: Run full build**

```bash
pnpm build
```
Expected: No compilation errors.

- [ ] **Step 2: Run type checking**

```bash
pnpm typecheck
```
Expected: No type errors.

- [ ] **Step 3: Run lint**

```bash
pnpm lint
```
Expected: No lint errors (or only pre-existing ones).

- [ ] **Step 4: Start the app and test every v0.3 requirement**

```bash
./start.sh
```

For each checklist item in `v0.3.md`, manually verify in the browser at http://localhost:3000 and mark as `[x]` when confirmed working:

**Contacts:**
1. Full name search works
2. Phone shows as +1-(xxx)-xxx-xxxx with country code input
3. Company field on every contact
4. Lifecycle stage from company
5. "Created By" with name, fallback "System"
6. Filter bar redesign with pills
7. Search scope covers name, company, email, phone, deal
8. Cancel button next to Create Contact
9. Column sorting
10. Column add/remove
11. Saved filter groups
12. Record count
13. Favorites with star

**Companies:**
1. Phone formatting
2. Lifecycle stage on company
3. Filter bar redesign
4. Search scope
5. Cancel button
6. Column sorting
7. Column add/remove
8. Saved filter groups
9. Record count
10. Favorites

**Deals/Pipelines:**
1. Renamed to "Pipelines"
2. Multiple pipelines dropdown
3. "All Opportunities" default
4. Card customization in Settings
5. Card footer icons (calendar, tasks, owner)
6. Calendar shows next action date
7. Task checkboxes and inline add

**Settings:**
1. Per-section settings pages
2. User management
3. Account settings

- [ ] **Step 5: Update v0.3.md — check off each item**

After verifying each requirement, edit `v0.3.md` to change `[]` to `[x]` for each passing item.

- [ ] **Step 6: Final commit**

```bash
git add v0.3.md
git commit -m "feat: v0.3 complete — all requirements verified and checked off"
```
