# 12 — Deployment & DevOps

## Overview

Local-first development with a clear path to AWS production deployment. Infrastructure is defined as code (Terraform) and managed through CI/CD pipelines.

---

## 12.1 Local Development

### docker-compose.yml Stack

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: crm_dev
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: localdev
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  opensearch:
    image: opensearchproject/opensearch:2
    ports: ["9200:9200"]
    environment:
      discovery.type: single-node
      plugins.security.disabled: "true"

  localstack:
    image: localstack/localstack
    ports: ["4566:4566"]
    environment:
      SERVICES: s3,ses,sqs
      # Pre-creates S3 buckets and SES identity on startup

  mailpit:
    image: axllent/mailpit
    ports:
      - "8025:8025"   # Web UI
      - "1025:1025"   # SMTP
```

### Development Workflow

```bash
# One-time setup
git clone <repo>
cp .env.example .env.local
docker-compose up -d
pnpm install
pnpm db:migrate
pnpm db:seed

# Daily development
docker-compose up -d          # Start infrastructure (if not running)
pnpm dev                      # Start API + web with hot reload

# Available at:
# Web UI:       http://localhost:3000
# API:          http://localhost:3001
# API docs:     http://localhost:3001/api/docs
# Email viewer: http://localhost:8025
# DB admin:     pnpm db:studio
```

---

## 12.2 AWS Architecture

### Production Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AWS Account                                 │
│                                                                      │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐     │
│  │     Route 53 (DNS)      │    │   CloudFront (CDN)          │     │
│  │  app.yourcrm.com        │    │  Static assets, images      │     │
│  └────────┬────────────────┘    │  Cache headers              │     │
│           │                      └──────────┬──────────────────┘     │
│           ▼                                 │                        │
│  ┌─────────────────────────┐               │                        │
│  │     ALB (Load Balancer) │◄──────────────┘                        │
│  │  SSL termination        │                                         │
│  │  WAF rules              │                                         │
│  │  Path-based routing     │                                         │
│  └────────┬────────────────┘                                         │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐        │
│  │              ECS Fargate Cluster                         │        │
│  │                                                          │        │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │        │
│  │  │ API Service   │  │ Web Service  │  │ Worker       │  │        │
│  │  │ (NestJS)      │  │ (Next.js)    │  │ Service      │  │        │
│  │  │ 2-10 tasks    │  │ 2-6 tasks    │  │ (BullMQ)     │  │        │
│  │  │ auto-scaled   │  │ auto-scaled  │  │ 2-8 tasks    │  │        │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │        │
│  └──────────────────────────┬──────────────────────────────┘        │
│                             │                                        │
│         ┌───────────────────┼───────────────────┐                   │
│         ▼                   ▼                   ▼                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐          │
│  │ RDS Postgres  │  │ ElastiCache  │  │ OpenSearch       │          │
│  │ Multi-AZ      │  │ Redis        │  │ Service          │          │
│  │ + Read Replica│  │ Cluster mode │  │ 2 data nodes     │          │
│  └──────────────┘  └──────────────┘  └──────────────────┘          │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐          │
│  │ S3 Buckets    │  │ SES          │  │ CloudWatch       │          │
│  │ - assets      │  │ Email        │  │ Logs + Metrics   │          │
│  │ - backups     │  │ sending      │  │ + Alarms         │          │
│  │ - exports     │  │              │  │                  │          │
│  └──────────────┘  └──────────────┘  └──────────────────┘          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │                VPC (10.0.0.0/16)                          │       │
│  │                                                           │       │
│  │  Public Subnets: ALB, NAT Gateway                        │       │
│  │  Private Subnets: ECS tasks, RDS, ElastiCache, OpenSearch│       │
│  │  Isolated Subnets: (future) sensitive data processing     │       │
│  │                                                           │       │
│  │  3 Availability Zones for high availability              │       │
│  └──────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Configuration

| Service | Spec (Start) | Spec (Scale) |
|---------|-------------|--------------|
| **API (Fargate)** | 2 tasks × 1 vCPU, 2GB RAM | 10 tasks × 2 vCPU, 4GB RAM |
| **Web (Fargate)** | 2 tasks × 0.5 vCPU, 1GB RAM | 6 tasks × 1 vCPU, 2GB RAM |
| **Worker (Fargate)** | 2 tasks × 1 vCPU, 2GB RAM | 8 tasks × 2 vCPU, 4GB RAM |
| **RDS PostgreSQL** | db.r6g.large (Multi-AZ) | db.r6g.2xlarge + 2 read replicas |
| **ElastiCache Redis** | cache.r6g.large | cache.r6g.xlarge (cluster mode) |
| **OpenSearch** | 2 × r6g.large.search | 4 × r6g.xlarge.search |
| **S3** | Standard | Standard + Intelligent Tiering |
| **CloudFront** | Standard distribution | Standard + custom caching policies |

### Auto-Scaling Policies

| Service | Metric | Scale Up | Scale Down |
|---------|--------|----------|------------|
| API | CPU > 70% for 3 min | +2 tasks | -1 task when < 40% for 10 min |
| API | Request count > 1000/min | +2 tasks | — |
| Web | CPU > 70% for 3 min | +1 task | -1 task when < 40% for 10 min |
| Worker | Queue depth > 1000 | +2 tasks | -1 task when depth < 100 for 10 min |

---

## 12.3 CI/CD Pipeline (GitHub Actions)

### Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit   │──▶│   Test    │──▶│  Build   │──▶│  Deploy  │──▶│  Verify  │
│  (push)   │   │           │   │          │   │ (staging) │   │          │
└──────────┘    └──────────┘    └──────────┘   └──────────┘    └──────────┘
                                                     │
                                               ┌─────▼──────┐
                                               │  Promote   │
                                               │ (production)│  ← manual approval
                                               └────────────┘
```

### Stage Details

**Test Stage (all PRs + main):**
```yaml
- Lint (ESLint + Prettier check)
- Type check (TypeScript --noEmit)
- Unit tests (Vitest, parallel)
- Integration tests (with test containers: Postgres, Redis)
- Security scan (npm audit, Snyk)
- OWASP ZAP baseline scan
- Build check (ensure build succeeds)
```

**Build Stage (main branch):**
```yaml
- Build Docker images (API, Web, Worker)
- Tag with commit SHA + branch
- Push to ECR
- Generate OpenAPI spec artifact
- Generate database migration plan
```

**Deploy to Staging:**
```yaml
- Run database migrations
- Update ECS services with new task definitions
- Wait for healthy deployment (ECS health checks)
- Run smoke tests against staging
- Run E2E tests (Playwright) against staging
```

**Promote to Production (manual approval):**
```yaml
- Run database migrations (with automatic rollback on failure)
- Rolling deployment (ECS: min healthy 50%, max 200%)
- Canary phase: route 10% traffic to new version for 10 min
- If error rate < threshold → full rollout
- If error rate > threshold → automatic rollback
- Post-deploy smoke tests
- Notify team (Slack)
```

---

## 12.4 Observability

### Logging

| Component | Implementation |
|-----------|----------------|
| **Structured logs** | JSON format via Pino (NestJS) |
| **Correlation IDs** | Request ID propagated through all log lines |
| **Log aggregation** | CloudWatch Logs → Log Insights for querying |
| **Log retention** | 30 days in CloudWatch; archived to S3 for compliance |
| **Sensitive data** | PII scrubbed from logs (email → e***@domain.com) |

### Metrics

| Category | Metrics |
|----------|---------|
| **Application** | Request rate, latency (P50/P95/P99), error rate, queue depth, active WebSocket connections |
| **Business** | Active users, contacts created, emails sent, tickets resolved, deals closed |
| **Infrastructure** | CPU, memory, disk, network, DB connections, cache hit rate |
| **External** | Third-party API latency, failure rates (Stripe, Gmail, etc.) |

### Alerts

| Alert | Condition | Channel |
|-------|-----------|---------|
| High error rate | 5xx > 1% for 5 min | PagerDuty + Slack |
| High latency | P95 > 2s for 5 min | Slack |
| Database CPU | > 80% for 10 min | Slack |
| Queue backlog | Depth > 5000 for 10 min | Slack |
| Deployment failure | ECS deployment circuit breaker | PagerDuty + Slack |
| Certificate expiry | < 14 days | Email + Slack |
| Disk usage | > 80% on RDS | Slack |

### Health Checks

```
GET /health          → {"status": "ok", "version": "1.2.3"}
GET /health/ready    → {"status": "ok", "db": "ok", "redis": "ok", "search": "ok"}
GET /health/live     → {"status": "ok"}  (always returns ok if process is running)
```

---

## 12.5 Database Operations

### Migration Strategy

- **TypeORM migrations** generated from entity changes
- Migrations run automatically in CI/CD before deployment
- Every migration must be **reversible** (up + down)
- Large data migrations run as background jobs, not in-line migrations
- Schema changes must be backward-compatible (deploy new code, then run migration, then clean up old code)

### Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| **Automated RDS snapshots** | Daily | 35 days |
| **Point-in-time recovery** | Continuous (5 min RPO) | 35 days |
| **Cross-region backup** | Daily | 7 days |
| **Logical backup (pg_dump)** | Weekly | 90 days (S3 + Glacier) |

### Disaster Recovery

| Scenario | RPO | RTO | Strategy |
|----------|-----|-----|----------|
| Single AZ failure | 0 | < 5 min | Multi-AZ RDS automatic failover |
| Region failure | < 5 min | < 1 hour | Cross-region read replica promotion |
| Data corruption | Point-in-time | < 30 min | RDS point-in-time recovery |
| Accidental deletion | Immediate | < 15 min | Soft-delete + recycle bin (app level) |

---

## 12.6 Environments

| Environment | Purpose | Data | Infrastructure |
|-------------|---------|------|----------------|
| **Local** | Developer machines | Seed data | Docker Compose |
| **CI** | Automated tests | Test fixtures | GitHub Actions + test containers |
| **Staging** | Pre-production testing | Sanitized copy of production | AWS (smaller instances) |
| **Production** | Live system | Real data | AWS (full spec) |
| **Sandbox** | API testing (per-tenant) | Seed data | Shared staging infra, isolated tenant |

---

## 12.7 Infrastructure as Code (Terraform)

```
infrastructure/terraform/
├── modules/
│   ├── vpc/            # VPC, subnets, NAT, security groups
│   ├── ecs/            # ECS cluster, services, task definitions
│   ├── rds/            # PostgreSQL RDS + replicas
│   ├── elasticache/    # Redis cluster
│   ├── opensearch/     # OpenSearch domain
│   ├── s3/             # Buckets + policies
│   ├── cloudfront/     # CDN distribution
│   ├── alb/            # Load balancer + target groups
│   ├── monitoring/     # CloudWatch dashboards, alarms
│   └── security/       # IAM roles, KMS keys, WAF
├── environments/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── backend.tf          # Remote state (S3 + DynamoDB lock)
```
