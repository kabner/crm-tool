# Contact Types + Custom Activity Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-managed contact types and custom activity types to the CRM, closing feature gaps with Copper CRM.

**Architecture:** Two new config tables (`contact_type_options`, `activity_type_options`) with CRUD APIs, a new `contact_type` column on contacts, and frontend settings UI + integration into existing contact/activity flows. All local-only — no deployment.

**Tech Stack:** NestJS + TypeORM (backend), Next.js 15 + React 19 + TanStack Query + Tailwind (frontend), PostgreSQL 16.

**Spec:** `docs/superpowers/specs/2026-04-07-phase1-contact-types-activity-types-design.md`

---

## File Map

### New Files
```
# Backend
apps/api/src/database/migrations/1712200000000-ContactTypesActivityTypes.ts
apps/api/src/modules/crm/entities/contact-type-option.entity.ts
apps/api/src/modules/crm/entities/activity-type-option.entity.ts
apps/api/src/modules/crm/services/contact-types.service.ts
apps/api/src/modules/crm/controllers/contact-types.controller.ts
apps/api/src/modules/crm/services/activity-types.service.ts
apps/api/src/modules/crm/controllers/activity-types.controller.ts

# Frontend
apps/web/src/hooks/use-contact-types.ts
apps/web/src/hooks/use-activity-types.ts
```

### Modified Files
```
# Backend
apps/api/src/modules/crm/entities/contact.entity.ts
apps/api/src/modules/crm/entities/index.ts
apps/api/src/modules/crm/crm.module.ts
apps/api/src/modules/crm/dto/create-contact.dto.ts
apps/api/src/modules/crm/dto/contact-filter.dto.ts
apps/api/src/modules/crm/services/contacts.service.ts

# Frontend
apps/web/src/hooks/use-contacts.ts
apps/web/src/app/(dashboard)/contacts/page.tsx
apps/web/src/app/(dashboard)/contacts/components/contacts-table.tsx
apps/web/src/app/(dashboard)/contacts/components/contact-form.tsx
apps/web/src/app/(dashboard)/contacts/[id]/page.tsx
apps/web/src/app/(dashboard)/settings/contacts/page.tsx
```

---

## Task 1: Database Migration

**Files:**
- Create: `apps/api/src/database/migrations/1712200000000-ContactTypesActivityTypes.ts`

- [ ] **Step 1: Write the migration file**

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContactTypesActivityTypes1712200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. contact_type_options table
    await queryRunner.query(`
      CREATE TABLE contact_type_options (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        color varchar NOT NULL DEFAULT 'gray',
        position integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contact_type_options_tenant ON contact_type_options(tenant_id, position)
    `);

    // 2. activity_type_options table
    await queryRunner.query(`
      CREATE TABLE activity_type_options (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name varchar NOT NULL,
        slug varchar NOT NULL,
        icon varchar NOT NULL DEFAULT 'circle',
        color varchar NOT NULL DEFAULT 'gray',
        is_interaction boolean NOT NULL DEFAULT true,
        is_system boolean NOT NULL DEFAULT false,
        position integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now(),
        UNIQUE(tenant_id, slug)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_activity_type_options_tenant ON activity_type_options(tenant_id, position)
    `);

    // 3. Add contact_type column to contacts
    await queryRunner.query(`
      ALTER TABLE contacts ADD COLUMN contact_type varchar
    `);

    // 4. Seed default contact types for all existing tenants
    await queryRunner.query(`
      INSERT INTO contact_type_options (tenant_id, name, color, position)
      SELECT t.id, v.name, v.color, v.position
      FROM tenants t
      CROSS JOIN (VALUES
        ('Customer', 'green', 0),
        ('Prospect', 'blue', 1),
        ('Partner', 'purple', 2),
        ('Vendor', 'orange', 3),
        ('Competitor', 'red', 4),
        ('Other', 'gray', 5)
      ) AS v(name, color, position)
    `);

    // 5. Seed default activity types for all existing tenants
    await queryRunner.query(`
      INSERT INTO activity_type_options (tenant_id, name, slug, icon, color, is_interaction, is_system, position)
      SELECT t.id, v.name, v.slug, v.icon, v.color, v.is_interaction, true, v.position
      FROM tenants t
      CROSS JOIN (VALUES
        ('Note', 'note', 'file-text', 'gray', false, 0),
        ('Task', 'task', 'check-square', 'blue', false, 1),
        ('Call', 'call', 'phone', 'green', true, 2),
        ('Email', 'email', 'mail', 'purple', true, 3),
        ('Meeting', 'meeting', 'calendar', 'orange', true, 4)
      ) AS v(name, slug, icon, color, is_interaction, position)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS contact_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS activity_type_options`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_type_options`);
  }
}
```

- [ ] **Step 2: Run migration**

Run: `pnpm db:migrate`
Expected: "Migrations complete" with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/database/migrations/1712200000000-ContactTypesActivityTypes.ts
git commit -m "feat: migration for contact_type_options, activity_type_options tables, contact_type column"
```

---

## Task 2: Backend Entities

**Files:**
- Create: `apps/api/src/modules/crm/entities/contact-type-option.entity.ts`
- Create: `apps/api/src/modules/crm/entities/activity-type-option.entity.ts`
- Modify: `apps/api/src/modules/crm/entities/contact.entity.ts`
- Modify: `apps/api/src/modules/crm/entities/index.ts`
- Modify: `apps/api/src/modules/crm/crm.module.ts`

- [ ] **Step 1: Create ContactTypeOption entity**

```typescript
// apps/api/src/modules/crm/entities/contact-type-option.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('contact_type_options')
@Index('idx_contact_type_options_tenant', ['tenantId', 'position'])
export class ContactTypeOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'gray' })
  color: string;

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 2: Create ActivityTypeOption entity**

```typescript
// apps/api/src/modules/crm/entities/activity-type-option.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique,
} from 'typeorm';

@Entity('activity_type_options')
@Unique(['tenantId', 'slug'])
@Index('idx_activity_type_options_tenant', ['tenantId', 'position'])
export class ActivityTypeOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ default: 'circle' })
  icon: string;

  @Column({ default: 'gray' })
  color: string;

  @Column({ name: 'is_interaction', default: true })
  isInteraction: boolean;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 3: Add contactType to Contact entity**

In `apps/api/src/modules/crm/entities/contact.entity.ts`, add after the `source` field:

```typescript
  @Column({ name: 'contact_type', nullable: true })
  contactType: string;
```

- [ ] **Step 4: Update barrel exports**

In `apps/api/src/modules/crm/entities/index.ts`, add:

```typescript
export { ContactTypeOption } from './contact-type-option.entity';
export { ActivityTypeOption } from './activity-type-option.entity';
```

- [ ] **Step 5: Register in CRM module**

In `apps/api/src/modules/crm/crm.module.ts`, add `ContactTypeOption` and `ActivityTypeOption` to the `TypeOrmModule.forFeature([...])` array. Import them from `./entities`.

- [ ] **Step 6: Verify compilation**

Run: `cd apps/api && npx tsc --noEmit`
Expected: Exit code 0.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/crm/entities/ apps/api/src/modules/crm/crm.module.ts
git commit -m "feat: ContactTypeOption, ActivityTypeOption entities, contactType on Contact"
```

---

## Task 3: Contact Types API

**Files:**
- Create: `apps/api/src/modules/crm/services/contact-types.service.ts`
- Create: `apps/api/src/modules/crm/controllers/contact-types.controller.ts`
- Modify: `apps/api/src/modules/crm/crm.module.ts`

- [ ] **Step 1: Create ContactTypesService**

```typescript
// apps/api/src/modules/crm/services/contact-types.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactTypeOption } from '../entities/contact-type-option.entity';

@Injectable()
export class ContactTypesService {
  constructor(
    @InjectRepository(ContactTypeOption)
    private readonly repo: Repository<ContactTypeOption>,
  ) {}

  async findAll(tenantId: string): Promise<ContactTypeOption[]> {
    return this.repo.find({
      where: { tenantId },
      order: { position: 'ASC' },
    });
  }

  async create(tenantId: string, data: { name: string; color?: string }): Promise<ContactTypeOption> {
    const maxPos = await this.repo
      .createQueryBuilder('ct')
      .select('COALESCE(MAX(ct.position), -1)', 'max')
      .where('ct.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const entity = this.repo.create({
      tenantId,
      name: data.name,
      color: data.color || 'gray',
      position: (maxPos?.max ?? -1) + 1,
    });
    return this.repo.save(entity);
  }

  async update(tenantId: string, id: string, data: { name?: string; color?: string; position?: number }): Promise<ContactTypeOption> {
    const entity = await this.repo.findOne({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Contact type not found');
    if (data.name !== undefined) entity.name = data.name;
    if (data.color !== undefined) entity.color = data.color;
    if (data.position !== undefined) entity.position = data.position;
    return this.repo.save(entity);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Contact type not found');
    await this.repo.remove(entity);
  }
}
```

- [ ] **Step 2: Create ContactTypesController**

```typescript
// apps/api/src/modules/crm/controllers/contact-types.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ContactTypesService } from '../services/contact-types.service';

@ApiTags('Contact Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/contact-types')
export class ContactTypesController {
  constructor(private readonly service: ContactTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List contact type options' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create contact type option' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: { name: string; color?: string },
  ) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact type option' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; color?: string; position?: number },
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact type option' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
```

- [ ] **Step 3: Register in CRM module**

Add `ContactTypesService` to providers/exports and `ContactTypesController` to controllers in `crm.module.ts`.

- [ ] **Step 4: Verify & commit**

Run: `cd apps/api && npx tsc --noEmit`

```bash
git add apps/api/src/modules/crm/services/contact-types.service.ts \
  apps/api/src/modules/crm/controllers/contact-types.controller.ts \
  apps/api/src/modules/crm/crm.module.ts
git commit -m "feat: contact types CRUD API"
```

---

## Task 4: Activity Types API

**Files:**
- Create: `apps/api/src/modules/crm/services/activity-types.service.ts`
- Create: `apps/api/src/modules/crm/controllers/activity-types.controller.ts`
- Modify: `apps/api/src/modules/crm/crm.module.ts`

- [ ] **Step 1: Create ActivityTypesService**

```typescript
// apps/api/src/modules/crm/services/activity-types.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityTypeOption } from '../entities/activity-type-option.entity';

@Injectable()
export class ActivityTypesService {
  constructor(
    @InjectRepository(ActivityTypeOption)
    private readonly repo: Repository<ActivityTypeOption>,
  ) {}

  async findAll(tenantId: string): Promise<ActivityTypeOption[]> {
    return this.repo.find({
      where: { tenantId },
      order: { position: 'ASC' },
    });
  }

  async create(tenantId: string, data: { name: string; slug: string; icon?: string; color?: string; isInteraction?: boolean }): Promise<ActivityTypeOption> {
    const existing = await this.repo.findOne({ where: { tenantId, slug: data.slug } });
    if (existing) throw new BadRequestException(`Activity type with slug "${data.slug}" already exists`);

    const maxPos = await this.repo
      .createQueryBuilder('at')
      .select('COALESCE(MAX(at.position), -1)', 'max')
      .where('at.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const entity = this.repo.create({
      tenantId,
      name: data.name,
      slug: data.slug,
      icon: data.icon || 'circle',
      color: data.color || 'gray',
      isInteraction: data.isInteraction ?? true,
      isSystem: false,
      position: (maxPos?.max ?? -1) + 1,
    });
    return this.repo.save(entity);
  }

  async update(tenantId: string, id: string, data: { name?: string; icon?: string; color?: string; isInteraction?: boolean; position?: number }): Promise<ActivityTypeOption> {
    const entity = await this.repo.findOne({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Activity type not found');
    if (data.name !== undefined) entity.name = data.name;
    if (data.icon !== undefined) entity.icon = data.icon;
    if (data.color !== undefined) entity.color = data.color;
    if (data.isInteraction !== undefined) entity.isInteraction = data.isInteraction;
    if (data.position !== undefined) entity.position = data.position;
    return this.repo.save(entity);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id, tenantId } });
    if (!entity) throw new NotFoundException('Activity type not found');
    if (entity.isSystem) throw new BadRequestException('Cannot delete system activity type');
    await this.repo.remove(entity);
  }
}
```

- [ ] **Step 2: Create ActivityTypesController**

```typescript
// apps/api/src/modules/crm/controllers/activity-types.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/auth/decorators/current-user.decorator';
import { ActivityTypesService } from '../services/activity-types.service';

@ApiTags('Activity Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/activity-types')
export class ActivityTypesController {
  constructor(private readonly service: ActivityTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List activity type options' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom activity type' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: { name: string; slug: string; icon?: string; color?: string; isInteraction?: boolean },
  ) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update activity type' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; icon?: string; color?: string; isInteraction?: boolean; position?: number },
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom activity type (system types cannot be deleted)' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
```

- [ ] **Step 3: Register in CRM module**

Add `ActivityTypesService` to providers/exports and `ActivityTypesController` to controllers.

- [ ] **Step 4: Verify & commit**

Run: `cd apps/api && npx tsc --noEmit`

```bash
git add apps/api/src/modules/crm/services/activity-types.service.ts \
  apps/api/src/modules/crm/controllers/activity-types.controller.ts \
  apps/api/src/modules/crm/crm.module.ts
git commit -m "feat: activity types CRUD API (system types protected)"
```

---

## Task 5: Backend — Contact Type Filter + DTO

**Files:**
- Modify: `apps/api/src/modules/crm/dto/create-contact.dto.ts`
- Modify: `apps/api/src/modules/crm/dto/contact-filter.dto.ts`
- Modify: `apps/api/src/modules/crm/services/contacts.service.ts`

- [ ] **Step 1: Add contactType to CreateContactDto**

In `create-contact.dto.ts`, add after the `leadStatus` field:

```typescript
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Contact type name' })
  contactType?: string;
```

- [ ] **Step 2: Add contactType to ContactFilterDto**

In `contact-filter.dto.ts`, add:

```typescript
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by contact type' })
  contactType?: string;
```

- [ ] **Step 3: Add contactType filter to contacts.service.ts findAll**

In the `findAll` method, after the existing `leadStatus` filter block, add:

```typescript
    if (filters.contactType) {
      qb.andWhere('contact.contactType = :contactType', { contactType: filters.contactType });
    }
```

- [ ] **Step 4: Verify & commit**

Run: `cd apps/api && npx tsc --noEmit`

```bash
git add apps/api/src/modules/crm/dto/ apps/api/src/modules/crm/services/contacts.service.ts
git commit -m "feat: contactType on create DTO and filter support"
```

---

## Task 6: Frontend Hooks

**Files:**
- Create: `apps/web/src/hooks/use-contact-types.ts`
- Create: `apps/web/src/hooks/use-activity-types.ts`
- Modify: `apps/web/src/hooks/use-contacts.ts`

- [ ] **Step 1: Create use-contact-types.ts**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ContactTypeOption {
  id: string;
  tenantId: string;
  name: string;
  color: string;
  position: number;
}

export function useContactTypes() {
  return useQuery<ContactTypeOption[]>({
    queryKey: ['contact-types'],
    queryFn: () => apiClient.get('/api/v1/contact-types'),
  });
}

export function useCreateContactType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) =>
      apiClient.post('/api/v1/contact-types', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-types'] }),
  });
}

export function useUpdateContactType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; color?: string; position?: number }) =>
      apiClient.patch(`/api/v1/contact-types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-types'] }),
  });
}

export function useDeleteContactType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/contact-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-types'] }),
  });
}
```

- [ ] **Step 2: Create use-activity-types.ts**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ActivityTypeOption {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  isInteraction: boolean;
  isSystem: boolean;
  position: number;
}

export function useActivityTypes() {
  return useQuery<ActivityTypeOption[]>({
    queryKey: ['activity-types'],
    queryFn: () => apiClient.get('/api/v1/activity-types'),
  });
}

export function useCreateActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; icon?: string; color?: string; isInteraction?: boolean }) =>
      apiClient.post('/api/v1/activity-types', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-types'] }),
  });
}

export function useUpdateActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; icon?: string; color?: string; isInteraction?: boolean; position?: number }) =>
      apiClient.patch(`/api/v1/activity-types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-types'] }),
  });
}

export function useDeleteActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/activity-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-types'] }),
  });
}
```

- [ ] **Step 3: Update use-contacts.ts**

Add `contactType: string | null` to the `Contact` interface.
Add `contactType?: string` to `ContactFilters`.
Add `contactType?: string` to `CreateContactInput`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/use-contact-types.ts \
  apps/web/src/hooks/use-activity-types.ts \
  apps/web/src/hooks/use-contacts.ts
git commit -m "feat: frontend hooks for contact types and activity types"
```

---

## Task 7: Frontend — Contacts Integration

**Files:**
- Modify: `apps/web/src/app/(dashboard)/contacts/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/contacts/components/contacts-table.tsx`
- Modify: `apps/web/src/app/(dashboard)/contacts/components/contact-form.tsx`
- Modify: `apps/web/src/app/(dashboard)/contacts/[id]/page.tsx`

- [ ] **Step 1: Add Contact Type to filter fields and column defs in page.tsx**

Add to `CONTACT_FILTER_FIELDS` array:
```typescript
{ key: 'contactType', label: 'Contact Type', type: 'select', options: [] }, // populated dynamically
```
Use `useContactTypes()` to populate the options at runtime. Map `contactTypeOptions` to `{ label: ct.name, value: ct.name }`.

Add to `ALL_COLUMNS` array:
```typescript
{ key: 'contactType', label: 'Contact Type', defaultVisible: true },
```

- [ ] **Step 2: Render contactType in contacts-table.tsx**

In the dynamic column rendering, add a case for `contactType`:
```typescript
{col === 'contactType' && (
  <td key={col} className="px-4 py-3 text-sm">
    {contact.contactType ? (
      <Badge variant="outline" style={{ borderColor: getContactTypeColor(contact.contactType) }}>
        {contact.contactType}
      </Badge>
    ) : '-'}
  </td>
)}
```

Use `useContactTypes()` to look up the color for each type name.

- [ ] **Step 3: Add contactType dropdown to contact-form.tsx**

Add a select field after leadStatus:
```typescript
<div className="space-y-2">
  <Label>Contact Type</Label>
  <select {...register('contactType')} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
    <option value="">Select type...</option>
    {contactTypes?.map((ct) => (
      <option key={ct.id} value={ct.name}>{ct.name}</option>
    ))}
  </select>
</div>
```

Fetch types with `useContactTypes()`.

- [ ] **Step 4: Show contactType badge on detail page**

In `contacts/[id]/page.tsx`, add a "Contact Type" field in the info card displaying a Badge with the type name and color.

- [ ] **Step 5: Verify & commit**

Run: `cd apps/web && npx tsc --noEmit`

```bash
git add apps/web/src/app/\(dashboard\)/contacts/
git commit -m "feat: contact type column, filter, form field, and detail display"
```

---

## Task 8: Frontend — Settings Page for Contact Types + Activity Types

**Files:**
- Modify: `apps/web/src/app/(dashboard)/settings/contacts/page.tsx`

- [ ] **Step 1: Replace placeholder with full settings UI**

The page should have two sections:

**Section 1: Contact Types**
- List of current types with name, color swatch, edit/delete buttons
- "Add Type" button that shows an inline form (name input + color select)
- Color select: predefined options (gray, blue, green, purple, orange, red, yellow, pink)
- Edit: inline edit on click
- Delete: confirm then delete (system-seeded ones can be deleted since they're not marked as system)

**Section 2: Activity Types**
- List of current types with name, icon, color, system badge, edit/delete buttons
- System types show a "System" badge and have no delete button
- "Add Activity Type" button with inline form: name, slug (auto-generated from name), icon (text input for lucide icon name), color select, isInteraction checkbox
- Edit: inline
- Delete: only non-system types

Both sections use Card components and follow existing settings page patterns (see settings/pipelines/page.tsx for reference).

- [ ] **Step 2: Verify & commit**

Run: `cd apps/web && npx tsc --noEmit`

```bash
git add apps/web/src/app/\(dashboard\)/settings/contacts/page.tsx
git commit -m "feat: settings page for managing contact types and activity types"
```

---

## Task 9: Verification

- [ ] **Step 1: Full build**

```bash
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 2: Start and test locally**

```bash
./start.sh
```

Test:
1. `GET /api/v1/contact-types` returns 6 seeded types
2. `POST /api/v1/contact-types` creates a new type
3. `GET /api/v1/activity-types` returns 5 system types
4. `POST /api/v1/activity-types` creates a custom type
5. `DELETE /api/v1/activity-types/:systemId` returns 400
6. Contact form shows Contact Type dropdown
7. Contacts table shows Contact Type column
8. Settings > Contacts shows both management sections
9. Creating/editing/deleting types works in Settings UI

- [ ] **Step 3: Final commit if any fixes needed**
