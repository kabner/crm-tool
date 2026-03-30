# 01 — Architecture & Tech Stack

## Overview

The platform is built as a **modular monolith** — a single deployable unit with strict module boundaries enforced at the code level. Each business domain (CRM, Sales, Marketing, etc.) lives in its own NestJS module with a well-defined public API. Modules communicate through a shared event bus, never by reaching into each other's internals.

This gives us monolith simplicity for local development and deployment while preserving the option to extract any module into an independent service when scale demands it.

---

## System Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   Web App (Next.js)  │  Mobile (React Native)  │  API      │
└──────────┬───────────┴────────────┬─────────────┴───────────┘
           │                        │
           ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER               │
│              (ALB + rate limiting + auth check)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVER (NestJS)                 │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   CRM    │ │  Sales   │ │Marketing │ │ Service  │       │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Content  │ │   Data   │ │Commerce  │ │Integr.   │       │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SHARED KERNEL                            │   │
│  │  Auth │ Events │ Tenancy │ Audit │ Notifications     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │PostgreSQL│ │  Redis   │ │OpenSearch│
        │  (RDS)   │ │(Elasti-  │ │ (AWS)    │
        │          │ │ Cache)   │ │          │
        └──────────┘ └──────────┘ └──────────┘
              │
              ▼
        ┌──────────┐
        │    S3    │
        │ (files)  │
        └──────────┘
```

---

## Project Structure

```
crm-tool/
├── apps/
│   ├── api/                    # NestJS backend application
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── crm/        # Contacts, companies, deals, activities
│   │   │   │   ├── sales/      # Pipelines, forecasting, sequences
│   │   │   │   ├── marketing/  # Campaigns, automation, email
│   │   │   │   ├── service/    # Tickets, knowledge base, chat
│   │   │   │   ├── content/    # CMS, blog, assets
│   │   │   │   ├── data/       # Analytics, reports, dashboards
│   │   │   │   ├── commerce/   # Products, invoices, subscriptions
│   │   │   │   └── integrations/ # Connectors, webhooks, sync
│   │   │   ├── shared/
│   │   │   │   ├── auth/       # JWT, OAuth, RBAC
│   │   │   │   ├── tenancy/    # Multi-tenant middleware
│   │   │   │   ├── events/     # Event bus, domain events
│   │   │   │   ├── audit/      # Audit log service
│   │   │   │   ├── notifications/ # Email, in-app, push
│   │   │   │   ├── search/     # OpenSearch abstraction
│   │   │   │   ├── storage/    # S3 file service
│   │   │   │   └── common/     # DTOs, decorators, guards, pipes
│   │   │   ├── database/
│   │   │   │   ├── migrations/ # TypeORM migrations
│   │   │   │   └── seeds/      # Dev/test seed data
│   │   │   └── config/         # Environment-based config
│   │   └── test/               # E2E tests
│   │
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/            # Next.js App Router pages
│       │   ├── components/     # Shared UI components
│       │   │   ├── ui/         # Design system primitives
│       │   │   └── features/   # Feature-specific components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── stores/         # Zustand state stores
│       │   ├── api/            # API client (generated from OpenAPI)
│       │   ├── lib/            # Utilities
│       │   └── types/          # Shared TypeScript types
│       └── public/             # Static assets
│
├── packages/
│   ├── shared-types/           # Types shared between api + web
│   ├── email-templates/        # MJML email templates
│   └── sdk/                    # Auto-generated client SDK
│
├── infrastructure/
│   ├── terraform/              # AWS infrastructure as code
│   ├── docker/                 # Docker configs
│   └── scripts/                # Deploy, seed, migrate scripts
│
├── docs/
│   └── plan/                   # This planning documentation
│
├── package.json                # Workspace root (pnpm)
├── pnpm-workspace.yaml
├── turbo.json                  # Turborepo build orchestration
├── docker-compose.yml          # Local dev (Postgres, Redis, OpenSearch)
├── .env.example
└── CLAUDE.md
```

---

## Monorepo Tooling

| Tool | Purpose |
|------|---------|
| **pnpm** | Package manager — fast, disk-efficient, strict |
| **Turborepo** | Build orchestration — caching, parallel tasks, dependency graph |
| **TypeScript** | Shared types across packages, strict mode everywhere |

---

## Backend Deep Dive

### Framework: NestJS

NestJS provides:
- **Module system** — maps cleanly to our domain modules with dependency injection
- **Guards & interceptors** — auth, tenancy, audit logging as cross-cutting concerns
- **OpenAPI generation** — auto-generated API docs and client SDKs
- **WebSocket gateway** — real-time features (chat, notifications, live updates)
- **Bull integration** — job queues for async processing
- **GraphQL module** — optional GraphQL layer alongside REST

### Module Boundaries

Each module exposes:
1. **Service facade** — the only way other modules call into it
2. **Domain events** — emitted to the event bus for loose coupling
3. **REST controllers** — HTTP endpoints
4. **GraphQL resolvers** — (optional) GraphQL types and resolvers

Modules **never** import each other's repositories or entities directly. Cross-module data access goes through the service facade or event subscriptions.

### Database Strategy

**PostgreSQL 16** with:
- **TypeORM** as the ORM (migrations, query builder, repository pattern)
- **Row-Level Security (RLS)** for tenant isolation — every query automatically scoped
- **JSONB columns** for custom fields — no EAV pattern, no schema changes for user-defined fields
- **Partitioning** for high-volume tables (events, audit_logs) by tenant + time
- **Read replicas** for analytics queries (separate connection pool)

#### Multi-Tenancy Implementation

```
Every table includes:
  tenant_id UUID NOT NULL REFERENCES tenants(id)

RLS policy on every table:
  CREATE POLICY tenant_isolation ON <table>
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

Set at connection time:
  SET app.current_tenant = '<tenant_uuid>';
```

This ensures tenant data isolation at the database level — even a bug in application code cannot leak data across tenants.

### Caching Strategy

**Redis** serves multiple roles:

| Role | Implementation |
|------|----------------|
| **Session cache** | User sessions, reducing DB lookups |
| **Query cache** | Frequently accessed, slow-changing data (org settings, pipeline configs) |
| **Rate limiting** | Token bucket per API key / user |
| **Real-time pub/sub** | WebSocket message distribution across server instances |
| **Job queues** | BullMQ queues for async processing |
| **Distributed locks** | Preventing duplicate processing (e.g., webhook dedup) |

Cache invalidation strategy: **Write-through for critical data, TTL-based for non-critical.**

### Search Strategy

**OpenSearch** indexes:
- Contacts (name, email, company, custom fields, notes)
- Companies (name, domain, industry)
- Tickets (subject, body, tags)
- Content (pages, blog posts, KB articles)
- Emails (subject, body, for thread search)

Sync: PostgreSQL → OpenSearch via domain events. Each module emits indexable events; a shared search service consumes them and updates indexes.

### Event System

The event bus is the backbone for module communication:

```typescript
// Events follow a standard envelope
interface DomainEvent {
  id: string;              // UUID
  type: string;            // e.g., 'contact.created'
  tenantId: string;
  userId: string;          // who triggered it
  occurredAt: Date;
  payload: Record<string, any>;
  metadata: {
    correlationId: string; // traces related events
    causationId: string;   // the event that caused this one
  };
}
```

**Implementation progression:**
1. **Local dev:** In-process EventEmitter2 (NestJS built-in)
2. **Single server:** PostgreSQL LISTEN/NOTIFY + Redis pub/sub
3. **Multi-server:** Amazon EventBridge or SQS/SNS

All events are persisted to an `events` table for replay, debugging, and audit.

### API Design

**REST** for standard CRUD and resource-oriented operations:
- Versioned: `/api/v1/contacts`, `/api/v1/deals`
- Consistent patterns: filtering, pagination, sorting, field selection
- Bulk operations: `POST /api/v1/contacts/bulk` for batch create/update/delete
- Standard error format with error codes

**GraphQL** for complex queries and frontend flexibility:
- Ideal for the frontend's "contact detail page" that pulls from 6 modules
- Subscriptions for real-time updates
- DataLoader pattern to prevent N+1 queries

**WebSocket** for real-time features:
- Live chat (service module)
- Notifications
- Collaborative editing indicators
- Pipeline board live updates

---

## Frontend Deep Dive

### Framework: Next.js (App Router)

- **Server Components** for initial loads — fast TTI, SEO for content pages
- **Client Components** for interactive features — drag-and-drop pipelines, form builders
- **Server Actions** for mutations — simplified data flow
- **Route Groups** to organize by module: `(crm)/`, `(sales)/`, `(marketing)/`, etc.

### State Management

| Scope | Tool |
|-------|------|
| Server state | TanStack Query (React Query) — caching, invalidation, optimistic updates |
| Client state | Zustand — lightweight, minimal boilerplate |
| Form state | React Hook Form + Zod — validation shared with backend |
| URL state | Next.js searchParams — filters, pagination, view modes |

### Design System

Built on **shadcn/ui** (Radix primitives + Tailwind CSS):
- Accessible by default (WCAG 2.1 AA)
- Themeable (dark mode, custom brand colors per tenant)
- Consistent component library: buttons, forms, tables, modals, toast, command palette
- Custom components: timeline, pipeline board, email composer, workflow builder

### Key Frontend Patterns

1. **Optimistic updates** — UI updates immediately, rolls back on error
2. **Infinite scroll + virtualization** — for large lists (contacts, tickets)
3. **Command palette** (Cmd+K) — quick navigation, inspired by Linear/Superhuman
4. **Keyboard shortcuts** — power-user productivity throughout
5. **Drag and drop** — pipeline boards, workflow builder, content editor
6. **Real-time indicators** — "Jane is viewing this contact" collaboration awareness

---

## Local Development Setup

```bash
# Prerequisites: Node 20+, pnpm, Docker

# Start infrastructure
docker-compose up -d  # PostgreSQL, Redis, OpenSearch, LocalStack (S3)

# Install dependencies
pnpm install

# Run migrations & seed
pnpm db:migrate
pnpm db:seed  # Creates demo tenant with sample data

# Start development
pnpm dev  # Starts API (port 3001) + Web (port 3000) concurrently

# Other useful commands
pnpm test           # Run all tests
pnpm test:e2e       # E2E tests
pnpm lint           # ESLint + Prettier
pnpm build          # Production build
pnpm db:studio      # Prisma Studio (DB viewer)
pnpm openapi:gen    # Regenerate API client from OpenAPI spec
```

### docker-compose.yml services

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 | 5432 | Primary database |
| Redis 7 | 6379 | Cache, queues, pub/sub |
| OpenSearch 2 | 9200 | Full-text search |
| LocalStack | 4566 | Local S3, SES simulation |
| Mailpit | 8025 | Email testing UI |

---

## Performance Targets

| Operation | Target |
|-----------|--------|
| Contact list (paginated, 50 items) | < 100ms |
| Contact detail (full timeline) | < 200ms |
| Global search | < 300ms |
| Dashboard load | < 500ms |
| Email send (queue acceptance) | < 50ms |
| Webhook delivery | < 5s (P95) |
| Report generation (complex) | < 10s |
| Bulk import (10k contacts) | < 60s |

---

## Testing Strategy

| Level | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Vitest | Business logic, services — 80%+ |
| Integration | Vitest + test containers | DB queries, module interactions — key paths |
| E2E (API) | Supertest | All API endpoints — happy path + auth |
| E2E (UI) | Playwright | Critical user journeys — 20 core flows |
| Performance | k6 | Load testing — scale targets above |
| Security | OWASP ZAP + custom | Automated scan in CI |

---

## Cross-Cutting Concerns

### Request Lifecycle

```
Request → Rate Limiter → Auth Guard → Tenant Resolver → Validation Pipe
  → Controller → Service → Repository → Database
  → Response Interceptor (formatting) → Audit Interceptor (logging)
  → Response
```

### Error Handling

Standardized error responses:

```json
{
  "statusCode": 422,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Must be a valid email address" }
  ],
  "requestId": "req_abc123",
  "timestamp": "2026-03-26T10:00:00Z"
}
```

### Logging

Structured JSON logging with correlation IDs:

```json
{
  "level": "info",
  "message": "Contact created",
  "tenantId": "t_123",
  "userId": "u_456",
  "requestId": "req_abc",
  "module": "crm",
  "contactId": "c_789",
  "duration": 45
}
```
