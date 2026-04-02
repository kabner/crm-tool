# AWS Deployment Instructions — CRM Platform

## Overview

Deploy the CRM platform ([github.com/kabner/crm-tool](https://github.com/kabner/crm-tool)) to AWS using an enterprise multi-account strategy with AWS Control Tower. This document covers the full scope: organization foundation, shared services, and application deployment.

The CRM is a full-stack application with:
- **Backend:** NestJS (TypeScript) REST API
- **Frontend:** Next.js 15 (App Router, React 19)
- **Database:** PostgreSQL 16 (multi-tenant with row-level security)
- **Cache:** Redis 7
- **Search:** OpenSearch 2
- **File Storage:** S3-compatible (assets, uploads)
- **Email:** SMTP/SES (transactional + marketing)
- **Async Processing:** SQS (email sends, webhook retries)

Repo structure:
```
apps/api/         # NestJS backend
apps/web/         # Next.js frontend
packages/shared-types/  # Shared TypeScript types
docker-compose.yml      # Local dev services (Postgres, Redis, OpenSearch, LocalStack, Mailpit)
```

---

## Phase 1 — AWS Control Tower & Organization Foundation

### 1.1 Enable AWS Organizations & Control Tower

1. Log into the **management account** (root account).
2. Enable AWS Organizations (if not already enabled).
3. Launch **AWS Control Tower** from the console.
4. Configure the landing zone:
   - Home region: `us-east-1` (or preferred primary region)
   - Governed regions: add any secondary regions needed
   - Control Tower will automatically create:
     - **Log Archive** account — centralized CloudTrail + Config logs
     - **Audit** account — delegated security admin

### 1.2 Create Organizational Units (OUs)

Create the following OU structure:

```
Root
├── Security OU         (auto-created by Control Tower)
│   ├── Log Archive
│   └── Audit
├── Infrastructure OU
│   └── Shared Services
└── Workloads OU
    ├── Dev
    └── Production
```

### 1.3 Create Accounts via Account Factory

Use Control Tower Account Factory to create:

| Account Name | OU | Purpose |
|---|---|---|
| `crm-shared-services` | Infrastructure | CI/CD, ECR, Route 53, pipeline artifacts |
| `crm-dev` | Workloads | Dev/staging CRM deployment |
| `crm-production` | Workloads | Production CRM deployment |

### 1.4 Configure Service Control Policies (SCPs)

Apply these SCPs to the Workloads OU:

- **Region deny:** Restrict to approved regions only (e.g., `us-east-1`, `us-west-2`)
- **Deny public S3 buckets:** Prevent `s3:PutBucketPolicy` with public access
- **Deny root user actions:** Prevent root logins in workload accounts
- **Require encryption:** Deny `s3:PutObject` without server-side encryption
- **Deny leaving org:** Prevent `organizations:LeaveOrganization`

### 1.5 Configure IAM Identity Center (SSO)

1. Enable IAM Identity Center in the management account.
2. Connect your identity source (Active Directory, Okta, or built-in directory).
3. Create permission sets:
   - `AdministratorAccess` — for infra team, mapped to Shared Services account
   - `PowerUserAccess` — for developers, mapped to Dev account
   - `ReadOnlyAccess` — mapped to Production account for most users
   - `DeploymentAccess` — custom, for CI/CD cross-account role assumption
4. Assign groups/users to accounts with appropriate permission sets.

### 1.6 Enable Organization-Wide Security Services

From the management account, enable and delegate to the Audit account:

| Service | Delegation | Purpose |
|---|---|---|
| **CloudTrail** | Org trail → Log Archive S3 bucket | API audit across all accounts |
| **AWS Config** | Aggregator in Audit account | Compliance rules org-wide |
| **GuardDuty** | Delegated admin → Audit account | Threat detection |
| **Security Hub** | Delegated admin → Audit account | Aggregated security findings |

---

## Phase 2 — Shared Services Account

All resources in this section are deployed to the `crm-shared-services` account.

### 2.1 ECR Repositories

Create container repositories:

| Repository | Purpose |
|---|---|
| `crm-tool/api` | NestJS backend Docker image |

Configure ECR image scanning on push. Set lifecycle policy to retain last 20 images.

Grant cross-account pull access to the Dev and Production accounts.

### 2.2 CI/CD Pipeline (CodePipeline + CodeBuild)

Create a pipeline with these stages:

```
Source (GitHub: kabner/crm-tool, main branch)
  → Build
    → Build NestJS API Docker image, push to ECR
    → Build Next.js frontend
    → Run `pnpm test` and `pnpm typecheck`
    → Run CDK synth + security scan (cfn-nag / checkov)
  → Deploy-Dev
    → CDK deploy to crm-dev account (cross-account role)
    → Run database migrations: `pnpm db:migrate`
    → Smoke test (health check endpoint)
  → Manual Approval
  → Deploy-Prod
    → CDK deploy to crm-production account (cross-account role)
    → Run database migrations: `pnpm db:migrate`
    → Smoke test
```

**CodeBuild project configuration:**
- Runtime: `aws/codebuild/amazonlinux2-x86_64-standard:5.0`
- Privileged mode: enabled (for Docker builds)
- Install phase: `corepack enable && pnpm install --frozen-lockfile`
- Environment variables: pull from Secrets Manager

**Cross-account deployment IAM roles:**
- In each workload account, create a `cdk-deploy-role` that the Shared Services CodeBuild role can assume
- Scope permissions to CloudFormation, ECS, S3, Secrets Manager, and related services

### 2.3 Route 53

- Create a hosted zone for the CRM domain (e.g., `crm.yourcompany.com`)
- Delegate subdomains to workload accounts:
  - `dev.crm.yourcompany.com` → Dev account
  - `crm.yourcompany.com` → Production account

### 2.4 S3 Artifact Bucket

Create an S3 bucket for CDK and pipeline artifacts. Enable:
- Versioning
- SSE-S3 encryption
- Cross-account access policies for Dev and Production accounts

---

## Phase 3 — Application Infrastructure (Per Environment)

Deploy these resources in both the `crm-dev` and `crm-production` accounts. Use **AWS CDK (TypeScript)** for all IaC. Sizes below are dev defaults; production overrides are noted.

### 3.1 VPC & Networking

| Resource | Dev | Production |
|---|---|---|
| VPC CIDR | `10.1.0.0/16` | `10.2.0.0/16` |
| AZs | 2 | 3 |
| Public subnets | 2 (for ALB, NAT) | 3 |
| Private subnets | 2 (for Fargate, Aurora, ElastiCache, OpenSearch) | 3 |
| NAT Gateway | 1 (single AZ) | 3 (one per AZ) |
| VPC Flow Logs | Enabled → CloudWatch | Enabled → CloudWatch + S3 |

### 3.2 Aurora Serverless v2 (PostgreSQL 16)

| Setting | Dev | Production |
|---|---|---|
| Engine | Aurora PostgreSQL 16 | Aurora PostgreSQL 16 |
| Capacity | 0.5–2 ACU | 2–16 ACU |
| Instances | 1 writer | 1 writer + 1 reader |
| Multi-AZ | No | Yes |
| Backup retention | 7 days | 30 days |
| Encryption | KMS (AWS managed) | KMS (CMK) |
| Security group | Allow 5432 from Fargate SG only | Same |

**Post-deploy:** Run migrations from the repo:
```bash
# From apps/api/
pnpm db:migrate
pnpm db:seed    # Dev only
```

The application uses TypeORM migrations located at `apps/api/src/database/migrations/`. The seed script at `apps/api/src/database/seeds/index.ts` creates demo data (10K contacts, 500 companies, 200 deals).

**Important:** The database uses row-level security (RLS) for multi-tenancy. Every table has a `tenantId` column. Verify RLS policies are applied after migration.

### 3.3 ElastiCache Serverless (Redis 7)

| Setting | Value |
|---|---|
| Engine | Redis 7 |
| Type | Serverless |
| Encryption in transit | TLS enabled |
| Encryption at rest | KMS |
| Security group | Allow 6379 from Fargate SG only |

Used for: session caching, refresh tokens, general application cache.

### 3.4 OpenSearch Serverless

| Setting | Dev | Production |
|---|---|---|
| Collection type | Search | Search |
| Capacity | Auto (will scale to minimum) | Auto |
| Encryption | AWS owned key | KMS CMK |
| Network | VPC access | VPC access |
| Data access policy | Fargate task role only | Same |

Used for: global search across contacts, companies, and deals (Cmd+K search feature).

**Note:** The app currently uses PostgreSQL `ILIKE` for search. OpenSearch integration exists as a stub at `apps/api/src/shared/search/`. If OpenSearch is not yet wired up, the app will function without it — PostgreSQL search is the fallback. You can defer OpenSearch deployment to reduce initial cost.

### 3.5 Fargate Service (NestJS API)

| Setting | Dev | Production |
|---|---|---|
| CPU / Memory | 0.5 vCPU / 1 GB | 1 vCPU / 2 GB |
| Desired count | 1 | 2+ |
| Auto-scaling | Min 1, Max 2 | Min 2, Max 10 |
| Scale metric | CPU > 70% | CPU > 70% |
| Health check | `GET /health` | Same |
| ALB | Internet-facing, HTTPS (ACM cert) | Same |
| Subnets | Private (behind NAT) | Same |

**Dockerfile:** Create a production Dockerfile for the API at the repo root (one does not currently exist). It should:
```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile
COPY apps/api/ apps/api/
COPY packages/shared-types/ packages/shared-types/
RUN pnpm --filter api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**Environment variables** the API expects (store in Secrets Manager / Parameter Store):

| Variable | Source | Description |
|---|---|---|
| `DATABASE_URL` | Secrets Manager | Aurora PostgreSQL connection string |
| `REDIS_URL` | Secrets Manager | ElastiCache Redis endpoint |
| `JWT_SECRET` | Secrets Manager | JWT signing key |
| `JWT_REFRESH_SECRET` | Secrets Manager | Refresh token signing key |
| `AWS_REGION` | Parameter Store | AWS region |
| `AWS_S3_BUCKET` | Parameter Store | S3 bucket name for assets |
| `SES_FROM_EMAIL` | Parameter Store | Default sender email |
| `OPENSEARCH_URL` | Secrets Manager | OpenSearch endpoint (if used) |
| `APP_URL` | Parameter Store | Frontend URL (for CORS, email links) |
| `PORT` | Parameter Store | `3001` |

### 3.6 Amplify Hosting (Next.js Frontend)

| Setting | Dev | Production |
|---|---|---|
| Source | GitHub: `kabner/crm-tool` | Same |
| Branch | `develop` (or `main`) | `main` |
| Framework | Next.js 15 (auto-detected) | Same |
| Build command | `pnpm --filter web build` | Same |
| Output dir | `apps/web/.next` | Same |
| Environment vars | `NEXT_PUBLIC_API_URL` = ALB URL | Same |
| Custom domain | `dev.crm.yourcompany.com` | `crm.yourcompany.com` |

The frontend is at `apps/web/` using Next.js App Router. It expects `NEXT_PUBLIC_API_URL` to point to the Fargate ALB endpoint.

### 3.7 S3 Bucket (Assets & Uploads)

| Setting | Value |
|---|---|
| Bucket name | `crm-assets-{account-id}-{region}` |
| Versioning | Enabled |
| Encryption | SSE-S3 (dev) / SSE-KMS CMK (prod) |
| Public access | Blocked |
| Access | Via CloudFront OAI or Fargate task role |
| CORS | Allow origin from frontend domain |
| Lifecycle | Transition to IA after 90 days (optional) |

The asset management module is at `apps/api/src/shared/storage/`. The app uses S3-compatible APIs (tested via LocalStack locally).

### 3.8 SES (Email)

1. Verify the sender domain in SES.
2. Request production access (move out of sandbox) for the Production account.
3. Configure DKIM, SPF, DMARC DNS records in Route 53.
4. The app sends email via SMTP or AWS SDK — see `apps/api/src/modules/marketing/` for the email engine (templates, sends, open/click tracking).

### 3.9 SQS Queues

| Queue | Purpose |
|---|---|
| `crm-email-sends` | Async email dispatch |
| `crm-webhook-deliveries` | Webhook delivery with retry |
| Dead-letter queues for each | Failed message capture |

Configure: 3 retries, 30-second visibility timeout, DLQ after 3 failures.

### 3.10 CloudWatch

| Resource | Log Group | Retention |
|---|---|---|
| Fargate API | `/ecs/crm-api` | 30 days (dev) / 90 days (prod) |
| Aurora | `/aws/rds/cluster/crm` | 30 days |
| ALB access logs | S3 bucket | 90 days |

Create alarms for:
- API 5xx error rate > 1%
- API p99 latency > 2s
- Aurora CPU > 80%
- Aurora connections > 80% of max
- Fargate task count = 0 (critical)

---

## Phase 4 — Security Hardening

### 4.1 Secrets Rotation

- Enable automatic rotation for Aurora credentials via Secrets Manager (30-day rotation)
- Rotate JWT secrets on a defined schedule

### 4.2 WAF

Attach AWS WAF to the ALB with these managed rule groups:
- `AWSManagedRulesCommonRuleSet`
- `AWSManagedRulesSQLiRuleSet`
- `AWSManagedRulesKnownBadInputsRuleSet`

### 4.3 Security Groups Summary

```
ALB SG:         Inbound 443 from 0.0.0.0/0
Fargate SG:     Inbound 3001 from ALB SG only
Aurora SG:      Inbound 5432 from Fargate SG only
ElastiCache SG: Inbound 6379 from Fargate SG only
OpenSearch SG:  Inbound 443 from Fargate SG only
```

No resource in the private subnets should have a public IP or be directly internet-accessible.

### 4.4 IaC Security Scanning

Before every deployment, the pipeline should run:
- `cfn-nag` on synthesized CloudFormation templates
- `checkov` for broader IaC policy checks
- Fail the pipeline on HIGH severity findings

---

## Phase 5 — Validation & Cutover

### 5.1 Dev Environment Validation

1. Pipeline deploys to Dev account successfully
2. Run database migrations: `pnpm db:migrate`
3. Seed demo data: `pnpm db:seed`
4. Verify health check: `GET https://api.dev.crm.yourcompany.com/health`
5. Verify Swagger docs load: `GET https://api.dev.crm.yourcompany.com/api/docs`
6. Log in via frontend with demo credentials: `admin@acme.com` / `Password123!`
7. Test: create contact, create deal, move deal through pipeline, send test email
8. Verify email delivery via SES (check CloudWatch for SES metrics)

### 5.2 Production Deployment

1. Manual approval gate in pipeline
2. Run migrations (no seed data in prod)
3. Verify all health checks
4. Configure custom domain DNS
5. Verify WAF is active
6. Verify GuardDuty and Security Hub are receiving findings

---

## Reference

- **Source repo:** [github.com/kabner/crm-tool](https://github.com/kabner/crm-tool)
- **Backend code:** `apps/api/` (NestJS, port 3001)
- **Frontend code:** `apps/web/` (Next.js, port 3000)
- **Database migrations:** `apps/api/src/database/migrations/`
- **Seed data:** `apps/api/src/database/seeds/`
- **Shared types:** `packages/shared-types/`
- **Docker Compose (local services):** `docker-compose.yml`
- **Planning docs:** `docs/plan/` (00-MASTER-PLAN through 13-ROADMAP)
