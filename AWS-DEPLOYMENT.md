# CRM Application -- AWS Deployment Guide

This is a standalone guide for deploying the CRM application to AWS. It covers architecture, environment configuration, Docker builds, deployment steps, migrations, CI/CD, and every pitfall encountered during the initial deployment. Follow it sequentially for a first deploy, or jump to the relevant section for ongoing operations.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [AWS Accounts and Infrastructure](#2-aws-accounts-and-infrastructure)
3. [Environment Variables](#3-environment-variables)
4. [Docker Build](#4-docker-build)
5. [Deploying to Dev](#5-deploying-to-dev)
6. [Deploying to Prod](#6-deploying-to-prod)
7. [Running Migrations](#7-running-migrations)
8. [GitHub Actions CI/CD](#8-github-actions-cicd)
9. [Pitfalls and Lessons Learned](#9-pitfalls-and-lessons-learned)
10. [Useful Commands](#10-useful-commands)

---

## 1. Architecture Overview

The CRM is two containerized applications running on AWS ECS Fargate:

- **API** -- NestJS backend (port 3001)
- **Web** -- Next.js frontend (port 3000, standalone output mode)

Both run as separate ECS services in the same cluster, behind a single Application Load Balancer with path-based routing:

```
                  Cloudflare (TLS termination)
                           |
                     ALB (HTTP/80)
                      /         \
           /api/* , /health      default (everything else)
                |                    |
         crm-{env}-api          crm-{env}-web
         (port 3001)            (port 3000)
```

### Backing Services

| Service | Technology | Purpose |
|---------|-----------|---------|
| Database | Aurora Serverless v2 (Postgres 16) | Primary data store |
| Cache | ElastiCache Serverless (Redis 7) | Session cache, rate limiting |
| Object Storage | S3 | File uploads, assets |
| Message Queues | SQS (email-sends, webhook-deliveries) | Async job processing |
| DNS/TLS | Cloudflare | Domain management, TLS termination |
| WAF | AWS WAF v2 on ALB | SQL injection, XSS, rate limiting |

### Key Architectural Decisions

- Cloudflare terminates TLS. The ALB listens on HTTP/80 only, not HTTPS/443.
- The API health check endpoint is `/health`. The web health check endpoint is `/`.
- ALB routes `/api/*` and `/health` to the API service; everything else goes to the web service.
- Auto-scaling is configured on CPU utilization (target 70%) for both services.

---

## 2. AWS Accounts and Infrastructure

### Account IDs

| Account | ID | Purpose |
|---------|------|---------|
| Management | `187038415272` | AWS Organizations root, Control Tower |
| Shared Services | `602578934562` | ECR repositories, GitHub OIDC provider |
| Dev | `769953010606` | Development environment (VPC, ECS, Aurora, etc.) |
| Prod | `975037863116` | Production environment |

All accounts are in `us-east-1`.

### ECR Repositories (Shared Services Account)

| Repository URI | Image |
|---------------|-------|
| `602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/api` | NestJS API |
| `602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/web` | Next.js frontend |

Images are tagged with both `latest` and the git SHA. Cross-account pull access is granted to dev and prod accounts.

### Infrastructure Repo

The AWS infrastructure is managed via CDK in the **kabner/stowe-cloud-infra** repository, NOT in this repo. This repo (kabner/crm-tool) contains only:

- Application source code (`apps/api`, `apps/web`, `packages/`)
- Dockerfiles (`Dockerfile.api`, `Dockerfile.web`)
- GitHub Actions workflow (`.github/workflows/deploy.yml`)

If you need to change VPC configuration, ECS task definitions, security groups, IAM roles, or any other infrastructure, that work happens in stowe-cloud-infra.

### Resource Naming Convention

| Resource | Dev | Prod |
|----------|-----|------|
| ECS Cluster | `crm-dev` | `crm-prod` |
| API Service | `crm-dev-api` | `crm-prod-api` |
| Web Service | `crm-dev-web` | `crm-prod-web` |
| API Log Group | `/ecs/crm-dev-api` | `/ecs/crm-prod-api` |
| Web Log Group | `/ecs/crm-dev-web` | `/ecs/crm-prod-web` |
| Domain | `dev-crm.stowe.cloud` | `crm.stowe.cloud` |

---

## 3. Environment Variables

The API container receives environment variables from three sources: plain values set in the CDK task definition, secrets injected from AWS Secrets Manager, and values read from SSM Parameter Store.

### Plain Environment Variables (set directly in CDK)

| Variable | Dev Value | Prod Value | Notes |
|----------|-----------|------------|-------|
| `PORT` | `3001` | `3001` | NestJS listen port |
| `NODE_ENV` | `development` | `production` | |
| `AWS_REGION` | `us-east-1` | `us-east-1` | |
| `AWS_S3_BUCKET` | (CDK-generated name) | (CDK-generated name) | Assets bucket |
| `APP_URL` | `https://dev-crm.stowe.cloud` | `https://crm.stowe.cloud` | |
| `CORS_ORIGIN` | `https://dev-crm.stowe.cloud` | `https://crm.stowe.cloud` | |
| `DATABASE_NAME` | `crm` | `crm` | Aurora default database name |

### Secrets from AWS Secrets Manager (injected by ECS)

These are injected into the container at startup by ECS. The task definition references the secret ARN and ECS pulls the value before the container starts.

| Variable | Source | Injection Format |
|----------|--------|-----------------|
| `DATABASE_HOST` | Aurora credentials secret | `{secret-arn}:host::` (JSON field extraction) |
| `DATABASE_PORT` | Aurora credentials secret | `{secret-arn}:port::` (JSON field extraction) |
| `DATABASE_USER` | Aurora credentials secret | `{secret-arn}:username::` (JSON field extraction) |
| `DATABASE_PASSWORD` | Aurora credentials secret | `{secret-arn}:password::` (JSON field extraction) |
| `JWT_SECRET` | `/{stack-name}/jwt-secret` | Full secret value |
| `JWT_REFRESH_SECRET` | `/{stack-name}/jwt-refresh-secret` | Full secret value |
| `REDIS_URL` | `/{stack-name}/redis-url` | Full secret value |

**IMPORTANT: The app does NOT use `DATABASE_URL`.** It uses the individual `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME` variables. See `apps/api/src/config/database.config.ts` and `apps/api/src/database/run-migrations.ts` for how these are consumed.

### How Secret ARN Resolution Works

ECS secret injection requires the **full** secret ARN (including the 6-character random suffix that Secrets Manager appends). CDK's `fromSecretNameV2` generates partial ARNs without this suffix, which causes `ResourceNotFoundException` at task startup.

To work around this, the data stack stores the full secret ARNs in SSM Parameter Store:

```
/{stack-name}/secret-arns/db-credentials  -> full ARN of Aurora credentials secret
/{stack-name}/secret-arns/jwt-secret      -> full ARN of JWT secret
/{stack-name}/secret-arns/jwt-refresh-secret -> full ARN of JWT refresh secret
/{stack-name}/secret-arns/redis-url       -> full ARN of Redis URL secret
```

The compute stack reads these SSM parameters at deploy time and uses them in the task definition's `Secrets` block via CloudFormation property overrides.

### Web Container Environment

The web container has a minimal set of variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://dev-crm.stowe.cloud` (dev) or `https://crm.stowe.cloud` (prod) |
| `NODE_ENV` | `development` (dev) or `production` (prod) |
| `HOSTNAME` | `0.0.0.0` (required — prevents Next.js from binding to Fargate's container hostname) |

---

## 4. Docker Build

### Critical Build Requirements

There are four things that MUST be correct in the Docker build or the containers will fail at runtime:

1. **`--shamefully-hoist` with pnpm install** -- pnpm uses symlinks in `node_modules` by default. When Docker `COPY` copies `node_modules` from the builder stage to the final stage, symlinks break. The `--shamefully-hoist` flag flattens the dependency tree so all packages are real files.

2. **Include `package.json` in the final API image** -- The health controller imports `../../package.json` to read the app version. If `package.json` is missing from the final image, the API crashes on startup with `Cannot find module '../../package.json'`.

3. **Create `/uploads` directory with node ownership** -- The `AssetsService` tries to create `/uploads` at startup. If the directory does not exist and the container runs as `node` (non-root), it fails with `EACCES permission denied`. The Dockerfile must `mkdir -p /uploads /tmp/uploads && chown -R node:node /uploads /tmp/uploads` before switching to `USER node`.

4. **Build for `linux/amd64` platform** -- ECS Fargate runs on amd64 instances. If you build on a Mac (Apple Silicon), Docker defaults to arm64, and the container will fail on ECS with an exec format error.

### Build Commands (Manual)

From the root of this repo:

```bash
# API image
docker buildx build \
  --platform linux/amd64 \
  -f Dockerfile.api \
  -t 602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/api:latest \
  .

# Web image
docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://dev-crm.stowe.cloud \
  -f Dockerfile.web \
  -t 602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/web:latest \
  .
```

### Dockerfile Reference

**Dockerfile.api** (multi-stage):
- Builder stage: `node:20-alpine`, enables corepack, runs `pnpm install --frozen-lockfile --shamefully-hoist`, copies API source, builds with `pnpm --filter api build`
- Final stage: `node:20-alpine`, copies `node_modules`, `dist/`, and `package.json` from builder, creates `/uploads` with node ownership, runs as `USER node`

**Dockerfile.web** (multi-stage):
- Builder stage: `node:20-alpine`, enables corepack, runs `pnpm install --frozen-lockfile --shamefully-hoist`, copies web source, builds with `pnpm --filter web build`
- Final stage: `node:20-alpine`, copies Next.js standalone output and static assets, runs `apps/web/server.js`

---

## 5. Deploying to Dev

### Prerequisites

- AWS CLI v2 installed
- Docker with buildx support
- Credentials that can assume `OrganizationAccountAccessRole` in the shared-services account (602578934562) and the dev account (769953010606)

### Step-by-Step

#### 1. Authenticate to ECR

```bash
# Assume role in shared-services account
aws sts assume-role \
  --role-arn arn:aws:iam::602578934562:role/OrganizationAccountAccessRole \
  --role-session-name ecr-push \
  --query 'Credentials' --output json

# Export the returned credentials (or use a named profile)
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  602578934562.dkr.ecr.us-east-1.amazonaws.com
```

#### 2. Build images for amd64

```bash
docker buildx build \
  --platform linux/amd64 \
  -f Dockerfile.api \
  -t 602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/api:latest \
  .

docker buildx build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://dev-crm.stowe.cloud \
  -f Dockerfile.web \
  -t 602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/web:latest \
  .
```

#### 3. Push to ECR

```bash
docker push 602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/api:latest
docker push 602578934562.dkr.ecr.us-east-1.amazonaws.com/crm/web:latest
```

#### 4. Force new ECS deployment

Switch credentials to the dev account:

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::769953010606:role/OrganizationAccountAccessRole \
  --role-session-name ecs-deploy \
  --query 'Credentials' --output json

# Export the returned credentials
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
```

Trigger the deployment:

```bash
aws ecs update-service \
  --cluster crm-dev \
  --service crm-dev-api \
  --force-new-deployment \
  --region us-east-1

aws ecs update-service \
  --cluster crm-dev \
  --service crm-dev-web \
  --force-new-deployment \
  --region us-east-1
```

#### 5. Monitor the deployment

```bash
# Watch service events
aws ecs describe-services \
  --cluster crm-dev \
  --services crm-dev-api crm-dev-web \
  --query 'services[].events[:5]' \
  --region us-east-1

# Wait for stabilization (can take several minutes)
aws ecs wait services-stable \
  --cluster crm-dev \
  --services crm-dev-api crm-dev-web \
  --region us-east-1
```

#### 6. Check logs

```bash
# API logs (most recent)
aws logs tail /ecs/crm-dev-api --since 10m --region us-east-1

# Web logs
aws logs tail /ecs/crm-dev-web --since 10m --region us-east-1
```

#### 7. Health check

```bash
curl https://dev-crm.stowe.cloud/health
```

Expected response: JSON with `status: "ok"` and the app version.

---

## 6. Deploying to Prod

The process is identical to dev with these substitutions:

| Parameter | Dev | Prod |
|-----------|-----|------|
| Account ID | `769953010606` | `975037863116` |
| ECS Cluster | `crm-dev` | `crm-prod` |
| API Service | `crm-dev-api` | `crm-prod-api` |
| Web Service | `crm-dev-web` | `crm-prod-web` |
| API Log Group | `/ecs/crm-dev-api` | `/ecs/crm-prod-api` |
| Web Log Group | `/ecs/crm-dev-web` | `/ecs/crm-prod-web` |
| Domain | `dev-crm.stowe.cloud` | `crm.stowe.cloud` |

### Prod-Specific Notes

- **Always deploy to dev first** and verify before deploying to prod.
- Prod uses a KMS Customer Managed Key (CMK) for encrypting secrets, S3, and SQS. The ECS execution role has `kms:Decrypt` permission for this.
- Prod has auto-scaling configured: min 2 / max 10 tasks for both API and web. Dev runs 1 task each.
- Prod Aurora runs 2-16 ACU with a reader replica. Dev runs 0.5-2 ACU, writer only.

### Prod Deployment Commands

```bash
# Assume role in prod account
aws sts assume-role \
  --role-arn arn:aws:iam::975037863116:role/OrganizationAccountAccessRole \
  --role-session-name ecs-deploy \
  --query 'Credentials' --output json

# Force new deployment
aws ecs update-service \
  --cluster crm-prod \
  --service crm-prod-api \
  --force-new-deployment \
  --region us-east-1

aws ecs update-service \
  --cluster crm-prod \
  --service crm-prod-web \
  --force-new-deployment \
  --region us-east-1

# Wait for stabilization
aws ecs wait services-stable \
  --cluster crm-prod \
  --services crm-prod-api crm-prod-web \
  --region us-east-1

# Health check
curl https://crm.stowe.cloud/health
```

---

## 7. Running Migrations

Migrations run as a one-off ECS task using the API task definition with a command override. The `run-migrations.ts` file creates a TypeORM `DataSource`, connects using `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME` environment variables (injected by ECS from Secrets Manager), runs all pending migrations, then exits.

### Running Migrations on Dev

```bash
# Ensure you have dev account credentials
aws ecs run-task \
  --cluster crm-dev \
  --task-definition crm-dev-api \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[SUBNET_ID_1,SUBNET_ID_2],securityGroups=[APP_SG_ID],assignPublicIp=DISABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "api",
      "command": ["node", "dist/database/run-migrations.js"]
    }]
  }' \
  --region us-east-1
```

Replace `SUBNET_ID_1,SUBNET_ID_2` with the private app subnet IDs and `APP_SG_ID` with the CRM app security group ID. These can be found in the CloudFormation stack outputs or by looking at the existing service's network configuration:

```bash
aws ecs describe-services \
  --cluster crm-dev \
  --services crm-dev-api \
  --query 'services[0].networkConfiguration' \
  --region us-east-1
```

### Running Migrations on Prod

Same command, but use `crm-prod` cluster, `crm-prod-api` task definition, and prod account credentials/subnets/security groups.

### Important Notes

- Migrations are **non-destructive** (additive schema changes only). They do not require a service restart.
- The migration task uses the same task definition as the API service, so it inherits all the same secrets and environment variables.
- Monitor the task logs in `/ecs/crm-{env}-api` to verify success. The script logs `Connected to database`, `Migrations complete`, and exits with code 0 on success.
- If a migration fails, the process exits with code 1. Check the task logs for the error.

---

## 8. GitHub Actions CI/CD

The workflow at `.github/workflows/deploy.yml` handles the full build-and-deploy pipeline.

### Pipeline Flow

```
push to main
  -> Build API and Web Docker images (ubuntu-latest runner, native amd64)
  -> Push to ECR in shared-services account (OIDC auth)
  -> Deploy to dev (assume cross-account role, ECS update-service)
  -> Wait for dev services to stabilize
  -> Run migrations on dev
  -> Smoke test dev (curl health endpoint)
  -> [Manual approval required -- GitHub environment protection rule on "production"]
  -> Deploy to prod (same steps)
  -> Run migrations on prod
  -> Smoke test prod
```

### Authentication Flow

1. GitHub Actions authenticates to the shared-services account via **OIDC federation** (no stored AWS credentials). It assumes the `github-actions-crm` role in account `602578934562`.
2. For deployment, it **chains** into the `ecs-deploy-role` in the target workload account (dev or prod) using `role-chaining: true`.

### Required GitHub Repository Variables

These must be set in the repository settings under Settings > Secrets and variables > Actions > Variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `AWS_REGION` | `us-east-1` | AWS region for all operations |
| `SHARED_SERVICES_ACCOUNT` | `602578934562` | Account hosting ECR repos |
| `DEV_ACCOUNT` | `769953010606` | Dev workload account |
| `PROD_ACCOUNT` | `975037863116` | Prod workload account |
| `ECR_REGISTRY` | `602578934562.dkr.ecr.us-east-1.amazonaws.com` | Full ECR registry URL |

### GitHub Environment Configuration

The `deploy-prod` job uses `environment: production`. You must configure a GitHub environment named `production` with:

- **Required reviewers**: At least one approver for production deploys
- This creates a manual approval gate between dev and prod deployments

### CI vs. Manual Deployment

The CI pipeline builds on `ubuntu-latest` (amd64), so it does not need the `--platform linux/amd64` flag. Manual builds from a Mac do need it.

---

## 9. Pitfalls and Lessons Learned

These are real issues encountered during deployment. Each one cost debugging time. Read them before your first deploy.

### 1. pnpm symlinks do not survive Docker COPY

**Symptom:** `Cannot find module` errors for packages that are clearly in `node_modules`.

**Cause:** pnpm's default `node_modules` layout uses symlinks. When Docker `COPY --from=builder` copies files between stages, symlinks are not preserved.

**Fix:** Use `--shamefully-hoist` in the pnpm install command. This flattens the dependency tree into a traditional `node_modules` structure without symlinks.

### 2. Missing package.json breaks the health endpoint

**Symptom:** API container crashes immediately on startup with `Cannot find module '../../package.json'`.

**Cause:** The health controller imports `../../package.json` to read the app version for the health check response. If the final Docker image only has `dist/` and `node_modules/`, this import fails.

**Fix:** `COPY --from=builder /app/apps/api/package.json ./package.json` in the Dockerfile.

### 3. Missing /uploads directory causes EACCES

**Symptom:** API crashes with `EACCES: permission denied, mkdir '/uploads'`.

**Cause:** The `AssetsService` tries to create an `/uploads` directory at startup. The container runs as the `node` user (non-root), which cannot create directories at the filesystem root.

**Fix:** Create the directory in the Dockerfile before switching to `USER node`:
```dockerfile
RUN mkdir -p /uploads /tmp/uploads && chown -R node:node /uploads /tmp/uploads
```

### 4. Mac builds arm64 by default -- ECS needs amd64

**Symptom:** ECS task starts, immediately exits. Logs show exec format error or no logs at all.

**Cause:** Docker on Apple Silicon Macs defaults to building `linux/arm64` images. ECS Fargate runs on `linux/amd64`.

**Fix:** Always use `--platform linux/amd64` when building locally:
```bash
docker buildx build --platform linux/amd64 ...
```

This is not needed in CI (GitHub Actions runners are amd64).

### 5. ECS secret injection requires FULL secret ARN with 6-character suffix

**Symptom:** ECS task fails to start. Events show `ResourceNotFoundException` referencing the secret ARN.

**Cause:** Secrets Manager appends a random 6-character suffix to every secret ARN (e.g., `arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-AbCdEf`). ECS secret injection requires the full ARN including this suffix. Partial ARNs without the suffix fail.

**Fix:** Use the `secretArn` property from the CDK `Secret` construct, which includes the full ARN. Do not construct ARNs manually.

### 6. CDK fromSecretNameV2 generates partial ARNs

**Symptom:** Same `ResourceNotFoundException` as above, but the CDK code looks correct.

**Cause:** `secretsmanager.Secret.fromSecretNameV2()` generates a partial ARN without the 6-character suffix. This works for most API calls but fails for ECS secret injection.

**Fix:** Store the full secret ARN in SSM Parameter Store (from the stack that creates the secret), then read it in the compute stack:
```typescript
// In data stack (creates the secret):
new ssm.StringParameter(this, 'ParamDbSecretArn', {
  parameterName: `/${this.stackName}/secret-arns/db-credentials`,
  stringValue: this.dbCluster.secret!.secretArn,
});

// In compute stack (references the secret):
const dbCredentialsArn = ssm.StringParameter.valueForStringParameter(
  this, `/${dataStackName}/secret-arns/db-credentials`
);
```

### 7. Cross-stack CDK references create cyclic dependencies

**Symptom:** `cdk deploy` fails with `Cyclic reference` or `Export ... cannot be deleted` errors.

**Cause:** If security groups for the database and cache are created in the networking stack, and both the data stack and compute stack reference them, CDK creates cross-stack exports that form dependency cycles.

**Fix:** Create DB and cache security groups in the data stack (not the networking stack). The data stack owns `sg-db-crm` and `sg-cache-crm`; it receives `sg-app-crm` as a prop and creates ingress rules locally.

### 8. VPC interface endpoints must be in the same subnet tier as ECS tasks

**Symptom:** ECS tasks time out pulling images or fetching secrets. No error, just hangs.

**Cause:** VPC interface endpoints (ECR, Secrets Manager, CloudWatch Logs) were placed in the PrivateData (PRIVATE_ISOLATED) subnets, but ECS tasks run in PrivateApp (PRIVATE_WITH_EGRESS) subnets. Interface endpoints must be reachable from the subnet where the client runs.

**Fix:** Place VPC interface endpoints in the PrivateApp subnets, or ensure routing allows the PrivateApp subnets to reach the PrivateData subnets where the endpoints live. The simplest fix is to put them in the same subnet tier as ECS.

### 9. KMS CMK decrypt permission needed on execution role for prod

**Symptom:** Prod tasks fail to start; dev works fine. Error references KMS access denied.

**Cause:** Prod secrets are encrypted with a Customer Managed Key (CMK). The ECS execution role (which pulls secrets before container start) needs `kms:Decrypt` and `kms:DescribeKey` permissions on the CMK. Dev uses the default AWS-managed key, which does not require explicit grants.

**Fix:** Add a policy statement to the execution role:
```typescript
executionRole.addToPolicy(new iam.PolicyStatement({
  sid: 'KmsDecryptForSecrets',
  actions: ['kms:Decrypt', 'kms:DescribeKey'],
  resources: ['*'], // or scope to specific CMK ARN
}));
```

### 10. CloudFormation ECS service stabilization timeout

**Symptom:** `cdk deploy` hangs for 30+ minutes, then rolls back.

**Cause:** When CloudFormation creates or updates an ECS service, it waits for the service to stabilize (all tasks healthy). If containers crash (due to any of the issues above), CloudFormation keeps retrying for its full stabilization timeout (~30 minutes) before rolling back.

**Fix:** For initial infrastructure deployments or when debugging container startup issues, set `desiredCount: 0` in CDK. Deploy the infrastructure first, then scale up the service separately with `aws ecs update-service --desired-count 1`. This lets you iterate on container issues without waiting for CloudFormation timeouts.

### 11. Cloudflare SSL mode must be "Flexible"

**Symptom:** `ERR_TOO_MANY_REDIRECTS` or `502 Bad Gateway` when accessing the site through Cloudflare.

**Cause:** The ALB only listens on HTTP/80 (no HTTPS listener, no ACM certificate). If Cloudflare's SSL mode is set to "Full" or "Full (Strict)", Cloudflare tries to connect to the origin over HTTPS/443, which the ALB does not serve.

**Fix:** Set Cloudflare SSL/TLS mode to **Flexible** for the `stowe.cloud` domain. In Flexible mode, Cloudflare terminates TLS for the client and connects to the ALB over HTTP/80.

### 12. `NEXT_PUBLIC_API_URL` must be set at Docker build time

**Symptom:** The web app makes API calls to `localhost:3001` (or the wrong host) in production, even though the ECS task definition has `NEXT_PUBLIC_API_URL` set correctly.

**Cause:** Next.js inlines `NEXT_PUBLIC_*` environment variables into the client JavaScript bundle during `next build`. Setting them as runtime environment variables in the ECS task definition has no effect on client-side code. The Dockerfile uses a build ARG:
```dockerfile
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```
Always pass `--build-arg NEXT_PUBLIC_API_URL=https://crm.stowe.cloud` (or the dev URL) when building the web image.

### 13. Next.js standalone binds to Fargate's HOSTNAME

**Symptom:** ECS tasks start successfully (no crash), but ALB health checks fail and the service never reaches a healthy state.

**Cause:** Next.js standalone server uses `process.env.HOSTNAME || '0.0.0.0'` as its bind address. Fargate sets `HOSTNAME` to the container's internal hostname (e.g., `ip-10-2-5-25.ec2.internal`), causing the server to bind only to that address — making it unreachable by the ALB health checks.

**Fix:** Set `HOSTNAME: '0.0.0.0'` in the ECS task definition environment variables.

### 14. `ecs-deploy-role` trust policy needs `sts:TagSession`

**Symptom:** GitHub Actions deploy step fails with "not authorized to perform: sts:TagSession".

**Cause:** The `aws-actions/configure-aws-credentials@v4` GitHub Action uses session tags when doing role chaining. The `ecs-deploy-role` trust policy in dev and prod accounts must allow both `sts:AssumeRole` AND `sts:TagSession` from the shared services account.

**Fix:** Update the trust policy on `ecs-deploy-role` in both the dev and prod accounts to include `sts:TagSession` alongside `sts:AssumeRole`.

### 15. Database must be seeded on first deploy

**Symptom:** After the first deploy and migration, the login page shows "Loading..." indefinitely.

**Cause:** There is no tenant in the database. The app queries for a tenant on load and hangs when none exists.

**Fix:** Run the seed script via ECS run-task after the first migration:
```bash
aws ecs run-task \
  --cluster crm-{env} \
  --task-definition {api-task-def} \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[...],securityGroups=[...],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["node","dist/database/seeds/seed.js"]}]}'
```
This creates the initial tenant (Acme Corporation), admin user, and demo data.

---

## 10. Useful Commands

### ECR Authentication

```bash
# Login to ECR (shared-services account)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  602578934562.dkr.ecr.us-east-1.amazonaws.com
```

### ECS Service Management

```bash
# List services in a cluster
aws ecs list-services --cluster crm-dev --region us-east-1

# Describe services (check status, events, task count)
aws ecs describe-services \
  --cluster crm-dev \
  --services crm-dev-api crm-dev-web \
  --region us-east-1

# Force new deployment (pulls latest image)
aws ecs update-service --cluster crm-dev --service crm-dev-api --force-new-deployment --region us-east-1
aws ecs update-service --cluster crm-dev --service crm-dev-web --force-new-deployment --region us-east-1

# Scale a service
aws ecs update-service --cluster crm-dev --service crm-dev-api --desired-count 2 --region us-east-1

# Wait for stabilization
aws ecs wait services-stable --cluster crm-dev --services crm-dev-api crm-dev-web --region us-east-1

# List running tasks
aws ecs list-tasks --cluster crm-dev --service-name crm-dev-api --region us-east-1

# Describe a specific task (see stopped reason)
aws ecs describe-tasks --cluster crm-dev --tasks TASK_ARN --region us-east-1
```

### Logs

```bash
# Tail API logs (last 10 minutes)
aws logs tail /ecs/crm-dev-api --since 10m --region us-east-1

# Tail with follow (live stream)
aws logs tail /ecs/crm-dev-api --since 10m --follow --region us-east-1

# Tail web logs
aws logs tail /ecs/crm-dev-web --since 10m --region us-east-1

# Search logs for errors
aws logs filter-log-events \
  --log-group-name /ecs/crm-dev-api \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s000) \
  --region us-east-1
```

### Secrets Manager

```bash
# List CRM secrets
aws secretsmanager list-secrets \
  --filter Key=name,Values=crm \
  --region us-east-1

# Get a secret value
aws secretsmanager get-secret-value \
  --secret-id SECRET_ARN_OR_NAME \
  --region us-east-1
```

### Health Checks

```bash
# Dev
curl https://dev-crm.stowe.cloud/health

# Prod
curl https://crm.stowe.cloud/health
```

### Run One-Off Migration Task

```bash
# Get network config from existing service
aws ecs describe-services \
  --cluster crm-dev \
  --services crm-dev-api \
  --query 'services[0].networkConfiguration' \
  --output json \
  --region us-east-1

# Run migration (replace SUBNETS and SG with values from above)
aws ecs run-task \
  --cluster crm-dev \
  --task-definition crm-dev-api \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"api","command":["node","dist/database/run-migrations.js"]}]}' \
  --region us-east-1
```

### Docker Build (Local, for Mac)

```bash
# Build API for ECS (amd64)
docker buildx build --platform linux/amd64 -f Dockerfile.api -t crm-api:latest .

# Build Web for ECS (amd64)
docker buildx build --platform linux/amd64 --build-arg NEXT_PUBLIC_API_URL=https://crm.stowe.cloud -f Dockerfile.web -t crm-web:latest .

# Build for local testing (native arch)
docker build -f Dockerfile.api -t crm-api:local .
docker build -f Dockerfile.web -t crm-web:local .
```
