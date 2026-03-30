# 10 — Security & Compliance

## Overview

Security is a cross-cutting concern baked into every layer of the platform. This document covers authentication, authorization, data protection, audit logging, and compliance frameworks. The system is designed to be SOC 2 and GDPR ready from the start.

---

## 10.1 Authentication

### User Authentication

| Feature | Description | Priority |
|---------|-------------|----------|
| **Email/password login** | Bcrypt-hashed passwords with minimum strength requirements | P0 |
| **JWT + refresh tokens** | Short-lived access tokens (15 min); long-lived refresh tokens (30 days) with rotation | P0 |
| **Multi-factor auth (MFA)** | TOTP (Google Authenticator, Authy) and SMS-based 2FA | P0 |
| **SSO - SAML 2.0** | Enterprise SSO via SAML (Okta, OneLogin, Azure AD) | P1 |
| **SSO - OIDC** | OpenID Connect for Google Workspace, Azure AD | P1 |
| **Password policies** | Configurable: min length, complexity, expiry, history | P0 |
| **Account lockout** | Lock after N failed attempts; CAPTCHA after M attempts | P0 |
| **Session management** | View active sessions; revoke individual sessions; forced logout | P0 |
| **Login audit log** | Track all login attempts with IP, device, location | P0 |
| **Remember device** | Trust devices to skip MFA for 30 days | P1 |
| **Magic link login** | Passwordless login via email link (optional) | P2 |
| **IP allowlisting** | Restrict access to specific IP ranges (per org) | P1 |

### API Authentication

| Feature | Description | Priority |
|---------|-------------|----------|
| **API keys** | Scoped, rotatable API keys with expiry | P0 |
| **OAuth 2.0** | Authorization code flow for third-party apps | P1 |
| **JWT bearer** | Service-to-service authentication | P0 |
| **Key rotation** | Generate new key, grace period, revoke old | P0 |

---

## 10.2 Authorization (RBAC)

### Role-Based Access Control

```
Organization
  └── Team (optional grouping)
       └── User
            └── Role(s)
                 └── Permission Set
```

#### Default Roles

| Role | Description |
|------|-------------|
| **Super Admin** | Full access to everything including billing, security settings |
| **Admin** | Full access to CRM, settings, user management (no billing) |
| **Sales Manager** | Full sales access + team member data; read access to marketing |
| **Sales Rep** | Own contacts/deals/activities; read access to shared resources |
| **Marketing Manager** | Full marketing access; read access to sales data |
| **Marketing User** | Create/edit campaigns, emails, forms; no publish without approval |
| **Service Manager** | Full service access + team metrics; read access to CRM |
| **Service Agent** | Own tickets + unassigned; read access to contacts |
| **Content Editor** | Create/edit content; no publish without approval |
| **Viewer** | Read-only access to dashboards and reports |
| **Custom** | Configurable permission set |

#### Permission Granularity

Permissions follow the pattern: `module.object.action`

```
Examples:
  crm.contacts.read          — View contacts
  crm.contacts.write         — Create/edit contacts
  crm.contacts.delete        — Delete contacts
  crm.contacts.export        — Export contact data
  crm.contacts.import        — Import contacts
  crm.contacts.bulk_edit     — Bulk operations

  sales.deals.read
  sales.deals.write
  sales.deals.delete
  sales.pipelines.configure  — Edit pipeline settings
  sales.forecasts.view_team  — See team forecasts (not just own)

  marketing.emails.send      — Publish/send marketing emails
  marketing.automation.publish — Activate automation workflows

  service.tickets.assign     — Assign tickets to others
  service.kb.publish         — Publish KB articles

  data.reports.create        — Create custom reports
  data.dashboards.share      — Share dashboards

  admin.users.manage         — Create/edit/deactivate users
  admin.roles.manage         — Create/edit custom roles
  admin.security.manage      — MFA, SSO, IP allowlist settings
  admin.billing.manage       — Subscription and payment settings

  integrations.api_keys.manage — Create/revoke API keys
  integrations.connect       — Connect new integrations
```

#### Record-Level Access

Beyond module permissions, record-level access controls who can see which records:

| Level | Description |
|-------|-------------|
| **Everything** | See all records in the org |
| **Team** | See records owned by anyone on their team |
| **Own** | See only records they own or are associated with |
| **Custom** | Rules-based: e.g., "Sales reps see contacts in their territory only" |

---

## 10.3 Data Protection

### Encryption

| Layer | Method |
|-------|--------|
| **In transit** | TLS 1.3 for all connections; HSTS headers; certificate pinning for mobile |
| **At rest (database)** | AWS RDS encryption (AES-256); transparent to application |
| **At rest (files)** | S3 server-side encryption (SSE-S3 or SSE-KMS) |
| **Sensitive fields** | Application-level encryption for: OAuth tokens, API keys, webhook secrets |
| **Backups** | Encrypted backups with separate key management |

### Key Management

- AWS KMS for encryption key management
- Per-tenant encryption keys for sensitive data (future: customer-managed keys)
- Key rotation on schedule (annual) with zero-downtime migration

### Data Isolation

- **Row-level security** in PostgreSQL ensures tenant data isolation at the database level
- Every query automatically scoped by `tenant_id` via RLS policies
- Separate S3 prefixes per tenant for file isolation
- Separate OpenSearch indices per tenant (or filtered aliases)

### Secrets Management

- AWS Secrets Manager for infrastructure secrets (DB passwords, API keys)
- Environment variables for application config (never in code)
- Integration credentials encrypted with tenant-specific keys in database
- No secrets in logs, error messages, or API responses

---

## 10.4 Audit Logging

Every mutation in the system is recorded in an immutable audit log.

### Audit Log Schema

```
┌─────────────────────┐
│    AuditLog          │
│                      │
│ id                   │  (UUID)
│ tenant_id            │
│ user_id              │  (who performed the action)
│ action               │  (create, update, delete, login, export, etc.)
│ resource_type        │  (contact, deal, ticket, user, setting, etc.)
│ resource_id          │
│ changes              │  (JSONB: {field: {old: x, new: y}})
│ ip_address           │
│ user_agent           │
│ request_id           │  (correlation ID)
│ metadata             │  (JSONB: additional context)
│ occurred_at          │
└──────────────────────┘
-- Partitioned by tenant_id + occurred_at
-- Write-only: no UPDATE or DELETE allowed
-- Retention: configurable (default 2 years; compliance may require longer)
```

### What Gets Audited

| Category | Events |
|----------|--------|
| **Authentication** | Login, logout, MFA setup, password change, failed login attempts, session revocation |
| **User management** | User created, deactivated, role changed, permissions modified |
| **Data access** | Record viewed (sensitive records only), data exported, bulk operations |
| **Data mutation** | Every create, update, delete with field-level change tracking |
| **Configuration** | Pipeline changes, SLA changes, integration connections, workflow changes |
| **Security** | API key created/revoked, SSO configured, IP allowlist changed |
| **Compliance** | GDPR data access request, data deletion request, consent changes |

### Audit Log Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Audit log viewer** | Searchable, filterable audit log in admin panel | P0 |
| **Filter by user** | See all actions by a specific user | P0 |
| **Filter by record** | See all changes to a specific record | P0 |
| **Export** | Export audit logs for compliance review | P0 |
| **Retention policy** | Configurable retention; archive to S3 after retention period | P1 |
| **Tamper protection** | Append-only table; hash chain for integrity verification | P1 |
| **Real-time alerts** | Alert on suspicious patterns: bulk deletes, off-hours access, unusual data exports | P2 |

---

## 10.5 GDPR Compliance

| Feature | Description | Priority |
|---------|-------------|----------|
| **Consent management** | Track consent per contact per purpose (marketing, analytics, etc.) | P0 |
| **Consent audit trail** | When, how, and what consent was given/withdrawn | P0 |
| **Right to access (DSAR)** | One-click export of all data for a contact across all modules | P1 |
| **Right to erasure** | Delete all data for a contact with cascade across modules | P1 |
| **Right to rectification** | Standard edit flows with audit trail | P0 |
| **Data portability** | Export in standard format (JSON, CSV) | P1 |
| **Processing records** | Maintain records of processing activities | P1 |
| **Privacy policy link** | Required on all forms, emails, and chat widgets | P0 |
| **Cookie consent** | Banner/modal for tracking script consent | P0 |
| **Data retention policies** | Auto-delete data after configurable retention period | P1 |
| **Breach notification** | Process and tooling for 72-hour breach notification | P1 |
| **DPO contact** | Configurable Data Protection Officer contact info | P1 |

---

## 10.6 SOC 2 Readiness

| Control Area | Implementation |
|-------------|----------------|
| **Access control** | RBAC, MFA, SSO, session management, IP allowlisting |
| **Logical access** | Tenant isolation (RLS), encrypted credentials, least-privilege |
| **Change management** | Git-based deployments, CI/CD pipeline, approval workflows |
| **Risk assessment** | Regular security scanning (OWASP ZAP), dependency auditing |
| **Monitoring** | Centralized logging, anomaly detection, uptime monitoring |
| **Incident response** | Documented incident response plan; alert escalation |
| **Data protection** | Encryption at rest + transit, backup procedures, key management |
| **Availability** | Multi-AZ deployment, auto-scaling, disaster recovery plan |
| **Vendor management** | Documented third-party dependencies and their compliance |

---

## 10.7 Application Security

### OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|---------------|------------|
| **Injection** | Parameterized queries (TypeORM), input validation (class-validator + Zod) |
| **Broken auth** | JWT with short TTL, refresh rotation, MFA, brute-force protection |
| **Sensitive data exposure** | TLS everywhere, field-level encryption, no secrets in responses |
| **XXE** | JSON-only APIs (no XML parsing) |
| **Broken access control** | RBAC guards on every endpoint, record-level access checks |
| **Security misconfiguration** | Hardened defaults, no stack traces in production, security headers |
| **XSS** | React's built-in escaping, CSP headers, sanitize rich-text input |
| **Insecure deserialization** | Input validation on all payloads, no eval/deserialize of untrusted data |
| **Known vulnerabilities** | Automated dependency scanning (Dependabot, Snyk) in CI |
| **Insufficient logging** | Comprehensive audit logging, security event alerts |

### Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (rely on CSP instead)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Public API (per key) | 100 req/s (configurable per tier) |
| Auth endpoints | 10 req/min per IP |
| Webhook delivery | 1000 deliveries/min per tenant |
| File uploads | 10 uploads/min per user |
| Bulk operations | 5 concurrent per tenant |
| Search | 30 req/min per user |

---

## Data Model (Security-specific)

```
┌─────────────────────┐
│       User           │
│                      │
│ id                   │
│ tenant_id            │
│ email                │
│ password_hash        │
│ first_name           │
│ last_name            │
│ status               │  (active, invited, deactivated)
│ mfa_enabled          │
│ mfa_secret           │  (encrypted TOTP secret)
│ mfa_backup_codes     │  (encrypted)
│ last_login_at        │
│ failed_login_count   │
│ locked_until         │
│ password_changed_at  │
│ avatar_url           │
│ timezone             │
│ locale               │
│ created_at           │
│ deactivated_at       │
└──────────────────────┘

┌─────────────────────┐
│       Role           │
│                      │
│ id                   │
│ tenant_id            │
│ name                 │
│ description          │
│ is_system            │  (built-in roles cannot be deleted)
│ permissions          │  (JSONB: permission set)
│ record_access_level  │  (everything, team, own, custom)
│ record_access_rules  │  (JSONB: custom access rules)
│ created_at           │
└──────────────────────┘

┌─────────────────────┐
│     UserRole         │
│                      │
│ user_id              │
│ role_id              │
│ granted_at           │
│ granted_by           │
└──────────────────────┘

┌─────────────────────┐
│     Session          │
│                      │
│ id                   │
│ user_id              │
│ refresh_token_hash   │
│ ip_address           │
│ user_agent           │
│ device_info          │  (JSONB: parsed UA)
│ location             │  (JSONB: geo from IP)
│ trusted_device       │
│ created_at           │
│ last_used_at         │
│ expires_at           │
│ revoked_at           │
└──────────────────────┘

┌─────────────────────┐
│      Team            │
│                      │
│ id                   │
│ tenant_id            │
│ name                 │
│ description          │
│ parent_team_id       │  → self (team hierarchy)
│ created_at           │
└──────────────────────┘

┌─────────────────────┐
│    TeamMember        │
│                      │
│ team_id              │
│ user_id              │
│ role                 │  (member, lead)
│ joined_at            │
└──────────────────────┘

┌─────────────────────┐
│    Consent           │
│                      │
│ id                   │
│ tenant_id            │
│ contact_id           │
│ purpose              │  (marketing_email, analytics, data_processing)
│ status               │  (granted, withdrawn)
│ source               │  (form, api, import, manual)
│ source_detail        │  (form ID, import ID, etc.)
│ ip_address           │
│ granted_at           │
│ withdrawn_at         │
│ metadata             │  (JSONB)
└──────────────────────┘

┌─────────────────────┐
│   Tenant             │
│                      │
│ id                   │
│ name                 │
│ domain               │
│ plan                 │  (free, starter, professional, enterprise)
│ settings             │  (JSONB: org-wide configuration)
│ security_settings    │  (JSONB: MFA policy, password policy, SSO config)
│ ip_allowlist         │  (text[])
│ created_at           │
│ trial_ends_at        │
│ subscription_id      │
└──────────────────────┘
```
