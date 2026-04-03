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

---

## Development Workflow

**The expected cycle for all changes is: Local → Dev → Prod.**

1. **Local development** — Make changes, run the full stack locally with `./start.sh` or `pnpm dev`. Verify the UI at http://localhost:3000 and test API at http://localhost:3001. Iterate until satisfied.
2. **Push to master** — This triggers the CI/CD pipeline automatically.
3. **Dev deployment** — CI builds images, deploys to `dev-crm.stowe.cloud`. Verify the feature works in the cloud environment.
4. **Prod deployment** — After dev passes, a manual approval gate in GitHub allows promotion to `crm.stowe.cloud`.

**Always test locally first.** The CI pipeline takes several minutes. Fast iteration happens on your machine, not in AWS.

## AWS Deployment Architecture

- **Accounts:** Shared services (602578934562) hosts ECR. Dev (769953010606) and Prod (975037863116) run workloads.
- **ECS Fargate** runs two services per environment: `crm-{env}-api` (port 3001) and `crm-{env}-web` (port 3000)
- **ALB** with path-based routing: `/api/*` and `/health` → API service, everything else → Web service
- **Aurora Serverless v2** (PostgreSQL 16) for the database — persists across deploys
- **ElastiCache Redis 7** for caching
- **Cloudflare** terminates TLS, proxies to ALB on port 80
- **WAF** on ALB with AWS managed rules + rate limiting

**Domains:**
- Dev: `dev-crm.stowe.cloud`
- Prod: `crm.stowe.cloud`

## CI/CD Pipeline

**Trigger:** Push to `master` branch.

**Workflow:** `.github/workflows/deploy.yml`

**Jobs:**
1. **Build** — Builds API image (`:latest`), dev Web image (`:dev` with `NEXT_PUBLIC_API_URL=https://dev-crm.stowe.cloud`), and prod Web image (`:latest` with `NEXT_PUBLIC_API_URL=https://crm.stowe.cloud`). Pushes all to ECR.
2. **Deploy to Dev** — Force new ECS deployment, wait for stabilization, run migrations, smoke test.
3. **Deploy to Prod** — Requires manual approval via GitHub `production` environment. Same steps as dev.

**Authentication:** GitHub OIDC → `github-actions-crm` role in shared services → role-chain to `ecs-deploy-role` in target account.

**Required GitHub Repository Variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Value |
|----------|-------|
| `AWS_REGION` | `us-east-1` |
| `SHARED_SERVICES_ACCOUNT` | `602578934562` |
| `DEV_ACCOUNT` | `769953010606` |
| `PROD_ACCOUNT` | `975037863116` |
| `ECR_REGISTRY` | `602578934562.dkr.ecr.us-east-1.amazonaws.com` |

## Database Migrations

**System:** TypeORM migrations with raw SQL at `apps/api/src/database/migrations/`.

**To add a migration:**
1. Create a new file: `apps/api/src/database/migrations/{timestamp}-{Name}.ts`
2. Implement `up()` and `down()` methods using raw SQL
3. Test locally: `pnpm db:migrate`
4. Push to master — CI runs migrations automatically after deploy

**Rules:**
- Migrations MUST have working `down()` methods for rollback
- Never use `synchronize: true` — always write explicit migrations
- Never drop a column that code still references — remove the code reference first, deploy, then drop the column in the next release
- Naming convention: `{timestamp}-{PascalCaseName}.ts` (e.g., `1711930000000-AddDealSalesFields.ts`)

**Seeding dev:** Run via ECS run-task with command override `["node","dist/database/seeds/seed.js"]`. Creates tenant "Acme Corporation", 6 users, 10K contacts, 500 companies, 200 deals. Login: `admin@acme.com` / `Password123!`

## Docker Build

**Critical requirements:**
- `--platform linux/amd64` when building on Apple Silicon (ECS runs x86_64)
- `--shamefully-hoist` in pnpm install (symlinks don't survive Docker COPY between stages)
- `--build-arg NEXT_PUBLIC_API_URL=...` for web image (Next.js bakes NEXT_PUBLIC_* at build time, NOT runtime)
- `package.json` must be copied to final API image (health endpoint imports it)
- `/uploads` directory must be created with `node` ownership in Dockerfile

**Image tags:**
- API: always `:latest`
- Web dev: `:dev` (baked with `https://dev-crm.stowe.cloud`)
- Web prod: `:latest` (baked with `https://crm.stowe.cloud`)

## Hard Rules

1. **Never set `desiredCount: 0`** in CDK config — this kills running services on deploy
2. **`HOSTNAME=0.0.0.0`** must be set in ECS web task definition — Next.js standalone binds to Fargate's container hostname otherwise, making ALB health checks fail
3. **`sts:TagSession`** is required on both the source role (github-actions-crm) and target role (ecs-deploy-role) trust policies for GitHub Actions role chaining
4. **Databases persist across deploys** — Aurora and Redis are not touched by CDK or ECS deployments
5. **ECS services have circuit breakers** — if a new deployment fails health checks, it automatically rolls back to the previous version
6. **All GitHub integrations must be scoped to `kabner/*` repos only**
7. **NEVER use `cdk deploy` to update ECS services with new code or task definition changes.** CloudFormation has a 30-minute ECS stabilization timeout that causes cascading rollback loops, resets desiredCount to 0, and can take hours to resolve. For app deployments, use the ECS API directly: `aws ecs register-task-definition` + `aws ecs update-service --force-new-deployment`. The CI/CD pipeline already does this correctly. Only use `cdk deploy` for infrastructure changes (new resources, security groups, IAM roles, ALB config).
