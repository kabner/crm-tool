# 13 — Roadmap & Phases

## Overview

The build is broken into 6 phases. Each phase delivers a usable, testable increment. The goal is to have a functional CRM that can replace basic HubSpot usage by end of Phase 2, with full feature parity by Phase 5.

---

## Phase 1 — Foundation (Weeks 1–6)

**Goal:** Core infrastructure, authentication, and basic CRM with contacts and companies.

### Deliverables

| Area | What's Built |
|------|-------------|
| **Infrastructure** | Docker Compose local dev; project scaffold (NestJS + Next.js monorepo); CI pipeline (lint, test, build) |
| **Database** | PostgreSQL setup; migration system; multi-tenant schema with RLS; seed data |
| **Auth** | Email/password login; JWT + refresh tokens; session management; password reset |
| **RBAC** | Role system (Super Admin, Admin, User); permission guards on all endpoints |
| **CRM - Contacts** | CRUD; custom properties (JSONB); search; list view with sorting/filtering; detail page with timeline |
| **CRM - Companies** | CRUD; contact-company association; domain auto-association |
| **CRM - Activities** | Notes, tasks; manual activity logging; activity timeline |
| **UI** | Design system setup (shadcn/ui); sidebar nav; login; contacts/companies list + detail pages |
| **API** | REST API for contacts, companies, activities; OpenAPI spec; Swagger docs |
| **Audit** | Basic audit logging for all mutations |

### Success Criteria
- Can create an account, log in, manage contacts and companies
- API docs live and functional
- CI pipeline passing on every PR
- Seed script creates 10K sample contacts in < 30 seconds

---

## Phase 2 — Sales & Deals (Weeks 7–12)

**Goal:** Pipeline management, deal tracking, and basic sales tools.

### Deliverables

| Area | What's Built |
|------|-------------|
| **CRM - Deals** | Full deal CRUD; association to contacts/companies; custom properties |
| **Pipelines** | Multiple pipelines; custom stages; pipeline configuration UI |
| **Pipeline Board** | Drag-and-drop Kanban board; deal cards; pipeline metrics bar |
| **Lists & Segments** | Static lists; smart lists with filter builder (AND/OR groups) |
| **Saved Views** | Save/load filter + column configurations; board vs. table toggle |
| **Duplicate Detection** | Email-based exact match; name fuzzy match; merge UI |
| **Bulk Operations** | Multi-select → bulk edit, delete, assign, add to list |
| **Import/Export** | CSV import with field mapping; CSV export |
| **Email Integration** | Gmail/Outlook OAuth connection; inbound/outbound email sync; email on timeline |
| **Calendar Integration** | Google/Outlook calendar sync; meetings on timeline |
| **Notifications** | In-app notification system; notification center; bell icon |
| **Search** | OpenSearch integration; global search across contacts, companies, deals |

### Success Criteria
- Full sales pipeline workflow: create deal → move through stages → close won/lost
- Import 50K contacts via CSV in < 2 minutes
- Gmail connected and syncing emails to contact timelines
- Global search returns results in < 300ms

---

## Phase 3 — Marketing & Email (Weeks 13–20)

**Goal:** Email marketing, marketing automation, forms, and website tracking.

### Deliverables

| Area | What's Built |
|------|-------------|
| **Email Builder** | Drag-and-drop email editor; templates; personalization tokens; mobile preview |
| **Email Sending** | SES integration; send broadcasts; throttling; bounce/complaint handling |
| **Email Tracking** | Open tracking (pixel); click tracking (link wrapping); unsubscribe handling |
| **A/B Testing** | Subject line and content A/B tests with statistical winner selection |
| **Automation** | Visual workflow builder; triggers (form, list, property change); actions (email, set property, wait, branch) |
| **Forms** | Form builder; embed codes; submission → create/update contact; spam protection |
| **Landing Pages** | Basic page builder; publish to custom slug; form embedding |
| **Website Tracking** | JavaScript tracking snippet; page view tracking; UTM capture; anonymous → known identity stitching |
| **Campaigns** | Campaign records; link emails, forms, landing pages to campaigns; basic attribution |
| **Lead Scoring** | Rule-based scoring (demographic + behavioral); MQL threshold triggers |
| **Lifecycle Automation** | Auto-advance lifecycle stages based on scoring + triggers |

### Success Criteria
- Send a marketing email to 10K contacts with tracking
- Build and activate a 5-step automated workflow
- Form submission creates contact and triggers workflow
- Website tracking identifies known visitors and logs page views

---

## Phase 4 — Service & Content (Weeks 21–28)

**Goal:** Customer support ticketing, knowledge base, live chat, and CMS.

### Deliverables

| Area | What's Built |
|------|-------------|
| **Ticketing** | Shared inbox; ticket CRUD; statuses, priorities, categories; assignment (manual + auto) |
| **Email-to-Ticket** | Inbound email processing; thread matching; auto-reply |
| **SLA Management** | SLA policies; business hours; SLA clock on tickets; breach alerts |
| **Canned Responses** | Create/manage response templates; quick insert in ticket replies |
| **Ticket Views** | Custom filtered views; "My tickets", "Unassigned", "Urgent" |
| **Knowledge Base** | Article editor; categories/sections; public + internal KB; search |
| **Live Chat** | Chat widget; agent inbox; routing; pre-chat form; visitor info |
| **CSAT** | Post-ticket satisfaction survey; score tracking |
| **Content CMS** | Block editor; blog engine; categories/tags; SEO fields; publish workflow |
| **Asset Management** | File library; image upload + optimization; CDN delivery; folder organization |
| **Sequence Engine** | Sales sequences: multi-step email + task automation; enrollment; analytics |

### Success Criteria
- Full ticket lifecycle: customer emails → ticket created → agent replies → resolved → CSAT survey
- Live chat functional with real-time messaging
- Knowledge base with 20+ articles, searchable
- Blog with published posts, SEO meta, RSS feed
- Sales sequence with 5 steps sends emails on schedule

---

## Phase 5 — Commerce, Data & Integrations (Weeks 29–36)

**Goal:** Invoicing, payments, subscriptions, analytics dashboards, and third-party integrations.

### Deliverables

| Area | What's Built |
|------|-------------|
| **Products** | Product catalog; pricing models (one-time, recurring); categories |
| **Invoicing** | Invoice creation; line items; templates; PDF generation; email delivery |
| **Payments** | Stripe integration; payment links; hosted checkout; refunds |
| **Subscriptions** | Subscription management; billing cycles; plan changes; dunning |
| **Revenue Metrics** | MRR/ARR tracking; churn analysis; LTV calculation |
| **Dashboards** | Dashboard builder; pre-built dashboards (Sales, Marketing, Service, Revenue); widget library |
| **Reports** | Report builder; cross-object reports; visualizations; export; scheduling |
| **Slack Integration** | Notifications; deal alerts; `/crm` lookup command |
| **Zapier Integration** | Triggers and actions for CRM events |
| **Webhooks** | Webhook subscriptions; HMAC signatures; retry logic; delivery logs |
| **Public API** | Complete REST API; API keys with scopes; rate limiting; versioning; SDK generation |
| **API Documentation** | Interactive docs site; code examples; authentication guide |
| **Forecasting** | Forecast categories; rep/manager forecast submission; quota tracking |

### Success Criteria
- Full quote-to-cash: quote → invoice → payment → revenue tracking
- Dashboard showing live KPIs from all modules
- Slack notifications working for deal stage changes
- Public API documented and functional with API key auth
- Webhook delivers reliably with retries

---

## Phase 6 — Polish, Scale & Deploy (Weeks 37–44)

**Goal:** Production-ready: AWS deployment, security hardening, performance optimization, advanced features.

### Deliverables

| Area | What's Built |
|------|-------------|
| **AWS Deployment** | Terraform infrastructure; ECS Fargate services; RDS, ElastiCache, OpenSearch, S3 |
| **CI/CD** | Full pipeline: test → build → deploy staging → promote production; canary deployments |
| **MFA** | TOTP-based two-factor authentication |
| **SSO** | SAML 2.0 + OIDC integration |
| **Advanced RBAC** | Custom roles; record-level access; team hierarchy |
| **GDPR Tools** | Data access request; right to erasure; consent management |
| **Audit Log UI** | Searchable audit log in admin panel |
| **Performance** | Database query optimization; caching layer tuning; CDN optimization; load testing |
| **Sync Engine** | Bidirectional sync framework; field mapping; conflict resolution |
| **Native Connectors** | Jira, Google Ads, QuickBooks (initial set) |
| **Multi-touch Attribution** | First-touch, last-touch, linear, U-shaped attribution models |
| **AI Features** | Lead scoring (ML-based); email subject suggestions; ticket auto-categorization |
| **PWA** | Installable; push notifications; offline contact viewing |
| **Security Hardening** | Penetration testing; OWASP ZAP full scan; security review; WAF rules |
| **Documentation** | Admin guide; user guide; developer guide; API reference |

### Success Criteria
- Running on AWS with auto-scaling handling 500 concurrent users
- Load test passes: 100 API req/s at < 200ms P95
- SSO configured and working with test IdP
- GDPR data access request exports all contact data across modules
- Zero critical/high security findings

---

## Post-Launch Roadmap

### Q1 Post-Launch
- Mobile app (React Native) — Phase 1 features
- Advanced marketing: ad management, social posting
- AI chatbot (RAG from knowledge base)
- Marketplace framework for third-party integrations

### Q2 Post-Launch
- Mobile app — Phase 2 features
- Advanced commerce: usage-based billing, revenue recognition
- Integration builder (visual Zapier-like)
- Advanced AI: deal risk scoring, churn prediction, NL queries

### Q3 Post-Launch
- Multi-language support (UI + content)
- Advanced analytics: cohort analysis, funnel analysis, user journeys
- Custom objects (user-defined entities beyond contacts/companies/deals)
- Partner portal

---

## Team Structure Recommendation

| Role | Count | Responsibility |
|------|-------|----------------|
| **Tech Lead / Architect** | 1 | Architecture decisions, code review, technical direction |
| **Backend Engineer (Senior)** | 2 | API, database, integrations, infrastructure |
| **Backend Engineer (Mid)** | 2 | Module implementation, tests, background jobs |
| **Frontend Engineer (Senior)** | 1 | Design system, complex UI (workflow builder, pipeline board) |
| **Frontend Engineer (Mid)** | 2 | Page implementation, forms, data visualization |
| **Full-Stack Engineer** | 1 | Bridge work, tooling, DevOps, CI/CD |
| **QA Engineer** | 1 | E2E tests, manual testing, security testing |
| **Product Designer** | 1 | UX design, prototyping, design system |
| **Product Manager** | 1 | Prioritization, user stories, stakeholder alignment |

**Total: ~12 people** for the full build. Can start with a smaller core team (5-6) for Phase 1-2 and expand.

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep | Delays every phase | Strict phase scope; P0/P1 only per phase; P2 goes to next phase |
| Email deliverability issues | Marketing module unusable | Early SES setup; domain warming; follow best practices from day 1 |
| Performance at 50K contacts | Slow UI, frustrated users | Performance testing from Phase 1; index optimization; pagination everywhere |
| Third-party API changes | Broken integrations | Adapter pattern isolates external APIs; version-pinned SDKs; monitoring |
| Security breach | Trust destruction | Security-first architecture; early penetration testing; audit logging |
| Key person dependency | Bus factor | Documented architecture; pair programming; cross-training |
| Migration complexity | Users can't switch from HubSpot | Build import tools early; provide migration guides; parallel running support |

---

## Definition of Done (per feature)

- [ ] Implemented and code reviewed
- [ ] Unit tests written (80%+ coverage for business logic)
- [ ] Integration test for critical paths
- [ ] API documented in OpenAPI spec
- [ ] Responsive (works on desktop + tablet + mobile web)
- [ ] Accessible (keyboard navigable, screen reader tested)
- [ ] Audit logged (all mutations)
- [ ] Tenant-isolated (RLS verified)
- [ ] Performance acceptable (meets targets in 01-ARCHITECTURE.md)
- [ ] Error handling (graceful failures, user-friendly messages)
