# CLAUDE.md

## Project

Full-featured CRM platform replacing HubSpot across 8 pillars: CRM Core, Sales, Marketing, Service, Content, Data, Commerce, and Integrations. Detailed plan docs live in `docs/plan/` (00-MASTER-PLAN through 13-ROADMAP).

## Tech Stack

- **Backend:** NestJS (TypeScript) — `apps/api/` — port 3001
- **Frontend:** Next.js 15 App Router (React 19) — `apps/web/` — port 3000
- **Database:** PostgreSQL 16 (TypeORM, multi-tenant with row-level security)
- **Cache:** Redis 7
- **Search:** OpenSearch 2
- **Monorepo:** pnpm workspaces + Turborepo
- **Shared types:** `packages/shared-types/`

## Build & Run

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker

# ONE COMMAND to start everything (infrastructure + migrations + seed + servers):
./start.sh

# Or manually:
docker-compose up -d  # PostgreSQL, Redis, OpenSearch, LocalStack, Mailpit
pnpm install
cp .env.example .env.local  # first time only
pnpm db:migrate
pnpm db:seed

# Start development (API + Web concurrently)
pnpm dev

# Build all packages
pnpm build
```

**Local services:**
- Web UI: http://localhost:3000
- API: http://localhost:3001
- API docs (Swagger): http://localhost:3001/api/docs
- Email viewer (Mailpit): http://localhost:8025
- Demo login: admin@acme.com / Password123!

## Test

```bash
pnpm test        # Run all tests (Vitest)
pnpm typecheck   # TypeScript type checking across all packages
pnpm lint        # ESLint + Prettier
```

## Architecture

### Monorepo Structure
```
apps/
  api/         # NestJS backend — modular monolith
  web/         # Next.js frontend — App Router
packages/
  shared-types/  # TypeScript types shared between API + web
infrastructure/  # Terraform (future), Docker configs
docs/plan/       # Detailed planning documentation (14 documents)
```

### Backend Module Structure
```
apps/api/src/
  modules/
    crm/        # Contacts, Companies, Deals, Activities, Custom Properties, Lists, Views
    sales/      # (stub) Pipelines, Sequences, Lead Scoring, Forecasting
    marketing/  # (stub) Email, Automation, Forms, Landing Pages
    service/    # (stub) Tickets, KB, Live Chat, SLAs
    content/    # (stub) CMS, Blog, Assets, SEO
    data/       # (stub) Analytics, Reports, Dashboards
    commerce/   # (stub) Products, Invoicing, Payments, Subscriptions
    integrations/ # (stub) API, Webhooks, Connectors, Sync
  shared/
    auth/       # JWT auth, RBAC (34 permissions, 5 default roles)
    audit/      # Audit logging interceptor + service
    tenancy/    # Multi-tenant middleware
    events/     # (stub) Domain event bus
    notifications/ # (stub)
    search/     # (stub) OpenSearch
    storage/    # (stub) S3
    common/     # DTOs, decorators, guards, pipes, filters
```

### Key Patterns
- **Multi-tenant:** Every entity has `tenantId`; RLS policies at DB level
- **Custom properties:** Stored as JSONB columns (not EAV)
- **Auth:** JWT access tokens (15min) + refresh tokens (30 days, bcrypt-hashed in sessions table)
- **RBAC:** `@RequirePermissions()` decorator + `RbacGuard` — permissions like `crm.contacts.read`
- **Audit:** `AuditInterceptor` logs all POST/PUT/PATCH/DELETE mutations automatically
- **API pattern:** `/api/v1/{resource}` — REST with pagination, filtering, sorting
- **Frontend state:** TanStack Query for server state, Zustand for client state, React Hook Form + Zod for forms

### Database
- TypeORM entities at `apps/api/src/modules/crm/entities/`
- Migrations at `apps/api/src/database/migrations/`
- Seed data at `apps/api/src/database/seeds/`
- 18 tables: tenants, users, roles, user_roles, sessions, contacts, companies, contact_companies, pipelines, deal_stages, deals, activities, custom_properties, lists, list_memberships, saved_views, audit_logs, notifications

### Current Status

**Phase 1 — Foundation (COMPLETE)**
- [x] Monorepo scaffold (pnpm, Turbo, Docker Compose)
- [x] Database schema + entities (18 tables)
- [x] Auth (JWT, refresh tokens, register, login, password reset)
- [x] RBAC (34 permissions, 5 roles, guard)
- [x] CRM Contacts (full CRUD API + frontend pages)
- [x] CRM Companies (full CRUD API + frontend pages)
- [x] Activities (notes, tasks, calls, emails, meetings + timeline)
- [x] Audit logging (interceptor + admin endpoints)
- [x] Seed data (10K contacts, 500 companies, 200 deals, 2K activities)

**Phase 2 — Sales & Deals (COMPLETE)**
- [x] Deals CRUD API (create, update, move stage, win/loss tracking)
- [x] Pipelines API (CRUD, stages, default pipeline)
- [x] Pipeline Kanban board (drag-and-drop deal cards between stages)
- [x] Deal detail page with stage selector
- [x] Lists & Segments (smart lists with filter builder, static lists)
- [x] CSV Import/Export (contacts + companies, field mapping, duplicate handling)
- [x] Global Search (PostgreSQL ILIKE across contacts, companies, deals, Cmd+K)
- [x] In-app Notifications (bell icon, unread count, mark as read)
- [x] Saved Views (save/load filter configurations per object type)

**Phase 3 — Marketing & Email (COMPLETE)**
- [x] Marketing entities + migration (14 new tables: emails, sends, templates, campaigns, workflows, forms, page views, lead scores)
- [x] Email engine (create, send via SMTP/Mailpit, open/click tracking pixels, unsubscribe)
- [x] Email builder frontend (block editor: header/text/button/image/divider sections, personalization tokens, mobile preview)
- [x] Send dialog (select lists/contacts, schedule, send now)
- [x] Marketing automation workflows (visual builder, node types: trigger/email/property/wait/branch/goal, publish/pause, enrollment tracking)
- [x] Forms builder (field types, drag to reorder, public submission endpoint, embed code)
- [x] Campaigns (CRUD, type badges, stats)
- [x] Lead scoring (models with rules, demographic + behavioral scoring, decay, MQL/SQL thresholds, test calculator)
- [x] Website tracking (JS snippet generator, page view recording, UTM capture, contact journey)

**Phase 4 — Service & Content (COMPLETE)**
- [x] Ticketing system (shared inbox, statuses/priorities, assignment, SLA, canned responses, CSAT)
- [x] Knowledge Base (categories/sections/articles, search, publish workflow, feedback, popular articles)
- [x] Content CMS (pages/blog/landing pages, block editor, versioning, publish/schedule, SEO fields)
- [x] Asset Management (file upload, folders, image metadata, CDN-ready URLs)
- [x] Live Chat (session management, agent inbox, message polling, convert-to-ticket)
- [x] Sales Sequences (multi-step email+task automation, enrollment, activate/pause, stats)

**Phase 5 — Commerce, Data & Integrations (COMPLETE)**
- [x] Commerce: Products catalog, invoicing (auto-numbered, line items, totals), payments, subscriptions (cancel/pause/resume), MRR/ARR/LTV revenue metrics
- [x] Dashboards: Overview dashboard with live KPI cards (contacts, deals, emails, tickets), sales/marketing/service summaries
- [x] Reports: Report builder (select data source, fields, filters, visualization), execute queries, export CSV
- [x] Webhooks: HMAC-SHA256 signed, retry logic, delivery logs, test endpoint
- [x] API Keys: Generate with scopes, bcrypt-hashed, prefix identification, revoke
- [x] Slack integration: Webhook notifications, deal/ticket alert formatting
- [ ] Phase 6: Polish, Scale & Deploy (security hardening, AWS, performance)
