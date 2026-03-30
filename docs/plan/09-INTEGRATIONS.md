# 09 — Integrations Module

## Overview

The Integrations module is the connectivity layer that makes the CRM platform work with the rest of the business's tool ecosystem. It provides a public API, webhook infrastructure, a sync engine for bidirectional data sync, native connectors to popular tools, and a visual integration builder. The goal is to replace Zapier, Segment (data routing), and native integrations from HubSpot/Salesforce.

**Key personas:** RevOps, IT admins, developers, marketing ops, sales ops.

**Benchmark tools:** Zapier, Make (Integromat), Segment, HubSpot Operations Hub, Tray.io, Workato, Fivetran, n8n.

---

## Feature Inventory

### 9.1 Public API

| Feature | Description | Priority |
|---------|-------------|----------|
| **REST API** | Full CRUD for all major objects: contacts, companies, deals, tickets, products, invoices, etc. | P0 |
| **GraphQL API** | Flexible queries with field selection, nested relationships | P1 |
| **API versioning** | Versioned endpoints (v1, v2) with deprecation policy | P0 |
| **API keys** | Tenant-level API keys with configurable scopes (read/write per module) | P0 |
| **OAuth 2.0** | OAuth provider for third-party app authorization | P1 |
| **Rate limiting** | Per-key rate limits with clear headers (X-RateLimit-*) | P0 |
| **Pagination** | Cursor-based pagination for list endpoints | P0 |
| **Filtering & sorting** | Query parameters for filtering any field; multi-field sorting | P0 |
| **Field selection** | `?fields=id,name,email` to reduce payload | P0 |
| **Batch operations** | Bulk create/update/delete (up to 100 records per call) | P0 |
| **Search endpoint** | Full-text search across objects | P0 |
| **OpenAPI spec** | Auto-generated, always up-to-date OpenAPI 3.0 specification | P0 |
| **API documentation** | Interactive docs (Swagger UI + custom docs site) | P0 |
| **SDKs** | Auto-generated SDKs: JavaScript/TypeScript, Python, Ruby, PHP | P1 |
| **Sandbox environment** | Isolated test environment with seed data; separate API keys | P1 |
| **API changelog** | Versioned changelog for all API changes | P1 |
| **Idempotency** | Idempotency keys for safe retries on POST/PUT | P0 |

### 9.2 Webhooks

| Feature | Description | Priority |
|---------|-------------|----------|
| **Webhook subscriptions** | Subscribe to any domain event: contact.created, deal.won, ticket.resolved, etc. | P0 |
| **Webhook management UI** | Create, test, enable/disable webhooks from settings | P0 |
| **Webhook security** | HMAC-SHA256 signature on every payload for verification | P0 |
| **Retry logic** | Exponential backoff retries (1s, 30s, 5m, 30m, 2h, 12h) up to 5 attempts | P0 |
| **Webhook logs** | Full delivery history: payload, response, timing, success/failure | P0 |
| **Test webhook** | Send test payload for any event type | P0 |
| **Webhook filtering** | Filter which events fire: "Only contact.created where lifecycle = 'Customer'" | P1 |
| **Batched webhooks** | Optionally batch events into single payloads (5s window) | P2 |
| **Dead letter queue** | After all retries exhausted, store failed payloads for manual review | P1 |

### 9.3 Native Connectors

Pre-built integrations with popular business tools:

#### Communication & Productivity

| Connector | Features | Priority |
|-----------|----------|----------|
| **Gmail** | Two-way email sync, send from CRM, email tracking | P0 |
| **Google Calendar** | Event sync, meeting scheduling, availability | P0 |
| **Outlook/O365** | Email and calendar sync (equivalent to Gmail) | P0 |
| **Slack** | Notifications to channels, deal alerts, `/crm` slash command for lookups, create contacts from Slack | P0 |
| **Microsoft Teams** | Notifications, meeting integration | P1 |
| **Zoom** | Meeting link generation, recording sync, attendance tracking | P1 |
| **Google Meet** | Meeting links for scheduler | P1 |

#### Sales & Marketing

| Connector | Features | Priority |
|-----------|----------|----------|
| **LinkedIn Sales Navigator** | Contact enrichment, InMail tracking | P2 |
| **Google Ads** | Lead sync, conversion tracking, audience sync | P2 |
| **Facebook/Meta Ads** | Lead forms sync, audience sync, conversion tracking | P2 |
| **LinkedIn Ads** | Lead gen form sync, audience sync | P2 |
| **Mailchimp** | (Migration) Import contacts and campaigns | P2 |

#### Support

| Connector | Features | Priority |
|-----------|----------|----------|
| **Jira** | Two-way ticket sync (support ticket → Jira issue), status sync | P1 |
| **GitHub Issues** | Sync bug reports between CRM tickets and GitHub | P2 |

#### Data & Analytics

| Connector | Features | Priority |
|-----------|----------|----------|
| **Google Analytics** | Import GA data for attribution | P2 |
| **Snowflake** | Event/data export to Snowflake warehouse | P2 |
| **BigQuery** | Event/data export to BigQuery | P2 |

#### Finance

| Connector | Features | Priority |
|-----------|----------|----------|
| **Stripe** | Deep integration: payment sync, subscription management (core to Commerce module) | P0 |
| **QuickBooks** | Invoice sync, payment recording | P2 |
| **Xero** | Invoice and contact sync | P2 |

#### Automation

| Connector | Features | Priority |
|-----------|----------|----------|
| **Zapier** | Triggers and actions for 5000+ apps via Zapier | P1 |
| **Make (Integromat)** | Triggers and actions | P2 |
| **n8n** | Self-hosted automation connector | P2 |

### 9.4 Sync Engine

Inspired by HubSpot Operations Hub and Fivetran.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Bidirectional sync** | Two-way data sync between CRM and connected apps | P1 |
| **Field mapping** | Map CRM fields to external app fields; auto-map common fields | P1 |
| **Sync rules** | Conflict resolution: CRM wins, external wins, most recent wins, don't sync if... | P1 |
| **Sync frequency** | Real-time (webhook-based), scheduled (every 5min/15min/1hr/daily) | P1 |
| **Sync history** | Full log of sync operations: records synced, conflicts, errors | P1 |
| **Sync filters** | Only sync records matching criteria (e.g., "only sync customers, not leads") | P1 |
| **Initial sync** | Full historical sync on first connection with dedup | P1 |
| **Incremental sync** | Only sync changed records after initial sync | P1 |
| **Error handling** | Individual record errors don't block batch; error records queued for review | P1 |
| **Data transformation** | Transform data during sync: format phone numbers, map picklist values, compute fields | P2 |

### 9.5 Integration Builder (Visual)

Inspired by Zapier and n8n.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Visual flow builder** | Connect triggers → actions across apps | P2 |
| **Triggers** | CRM events + external app events (webhooks) | P2 |
| **Actions** | CRM operations + external app API calls | P2 |
| **Conditions** | If/else branching based on data values | P2 |
| **Data mapping** | Map fields between trigger data and action inputs | P2 |
| **Formatters** | Text manipulation, date formatting, number formatting, lookups | P2 |
| **Multi-step** | Chain multiple actions sequentially | P2 |
| **Error handling** | Retry, fallback, notify on failure | P2 |
| **Templates** | Pre-built integration recipes | P2 |
| **Testing** | Test with sample data before activating | P2 |

### 9.6 Marketplace

| Feature | Description | Priority |
|---------|-------------|----------|
| **App marketplace** | Browse and install integrations from a catalog | P2 |
| **App listing pages** | Description, screenshots, reviews, setup instructions | P2 |
| **One-click install** | OAuth-based connection flow | P2 |
| **App categories** | Organize by function: sales, marketing, finance, productivity | P2 |
| **Partner SDK** | SDK for third-party developers to build integrations | P3 |
| **Review system** | Ratings and reviews for marketplace apps | P3 |

---

## Data Model

```
┌──────────────────────┐
│   Integration         │
│                       │
│ id                    │
│ tenant_id             │
│ type                  │  (native, custom, zapier)
│ provider              │  (gmail, slack, stripe, jira, custom)
│ name                  │  (display name)
│ status                │  (connected, disconnected, error)
│ credentials           │  (JSONB, encrypted: tokens, API keys)
│ config                │  (JSONB: provider-specific settings)
│ connected_by          │  → User
│ connected_at          │
│ last_sync_at          │
│ error_message         │
│ metadata              │  (JSONB)
└──────────────────────┘

┌──────────────────────┐
│   WebhookEndpoint     │
│                       │
│ id                    │
│ tenant_id             │
│ url                   │
│ secret                │  (for HMAC signing)
│ events                │  (text[]: subscribed event types)
│ filter_config         │  (JSONB: optional event filtering)
│ status                │  (active, paused)
│ created_by            │
│ created_at            │
└──────────────────────┘

┌──────────────────────┐
│  WebhookDelivery      │
│                       │
│ id                    │
│ endpoint_id           │
│ event_type            │
│ payload               │  (JSONB)
│ status                │  (pending, success, failed, retrying)
│ attempts              │
│ last_attempt_at       │
│ response_status       │
│ response_body         │  (truncated)
│ duration_ms           │
│ next_retry_at         │
│ created_at            │
└──────────────────────┘

┌──────────────────────┐
│     SyncConfig        │
│                       │
│ id                    │
│ integration_id        │  → Integration
│ direction             │  (inbound, outbound, bidirectional)
│ crm_object            │  (contacts, companies, deals, tickets)
│ external_object       │  (provider-specific object name)
│ field_mapping         │  (JSONB: [{crm_field, external_field, transform}])
│ sync_frequency        │  (realtime, 5min, 15min, 1hr, daily)
│ conflict_resolution   │  (crm_wins, external_wins, most_recent, skip)
│ filter_config         │  (JSONB: which records to sync)
│ status                │  (active, paused, error)
│ last_sync_at          │
│ last_sync_result      │  (JSONB: {synced: 45, errors: 2, conflicts: 1})
└──────────────────────┘

┌──────────────────────┐
│     SyncLog           │
│                       │
│ id                    │
│ sync_config_id        │
│ started_at            │
│ completed_at          │
│ status                │  (success, partial, failed)
│ records_synced        │
│ records_created       │
│ records_updated       │
│ records_skipped       │
│ errors                │  (JSONB: [{record_id, error}])
│ conflicts             │  (JSONB: [{record_id, crm_value, external_value, resolution}])
└──────────────────────┘

┌──────────────────────┐
│   ExternalMapping     │  (links CRM records to external system IDs)
│                       │
│ id                    │
│ tenant_id             │
│ integration_id        │
│ crm_object            │
│ crm_record_id         │
│ external_object       │
│ external_record_id    │
│ last_synced_at        │
│ sync_hash             │  (detect changes)
└──────────────────────┘

┌──────────────────────┐
│     APIKey            │
│                       │
│ id                    │
│ tenant_id             │
│ name                  │
│ key_hash              │  (bcrypt hash; plain key shown only on creation)
│ key_prefix            │  (first 8 chars for identification)
│ scopes                │  (JSONB: {contacts: 'read', deals: 'read_write', ...})
│ rate_limit            │  (requests per second)
│ expires_at            │
│ last_used_at          │
│ created_by            │
│ created_at            │
│ revoked_at            │
└──────────────────────┘

┌──────────────────────┐
│   OAuthApp            │  (for third-party apps using our OAuth)
│                       │
│ id                    │
│ name                  │
│ client_id             │
│ client_secret_hash    │
│ redirect_uris         │  (text[])
│ scopes                │
│ logo_url              │
│ website_url           │
│ created_by            │  → Tenant
│ status                │  (active, suspended)
└──────────────────────┘
```

---

## Key Workflows

### OAuth Connection Flow (Native Connector)

```
1. User clicks "Connect Gmail" in integration settings
2. Redirect to Google OAuth consent screen:
   - Scopes: gmail.readonly, gmail.send, gmail.modify
   - State parameter with encrypted tenant + user context
3. User grants access
4. Google redirects back with authorization code
5. Backend exchanges code for access + refresh tokens
6. Encrypt and store tokens in Integration record
7. Trigger initial sync:
   a. Sync recent emails (last 30 days)
   b. Match emails to contacts by email address
   c. Create activity records for matched emails
8. Set up ongoing sync:
   a. Gmail push notifications (webhook) for real-time
   b. Fallback: poll every 5 minutes
9. Integration status → "connected"
```

### Webhook Delivery Flow

```
1. Domain event emitted (e.g., contact.created)
2. Webhook service queries active endpoints subscribed to this event type
3. For each matching endpoint:
   a. Check filter conditions (if any)
   b. Serialize payload (standard envelope format)
   c. Compute HMAC-SHA256 signature
   d. Queue delivery job in BullMQ
4. Worker processes delivery:
   a. POST to endpoint URL with headers:
      - X-Webhook-ID: delivery ID
      - X-Webhook-Signature: HMAC signature
      - X-Webhook-Timestamp: ISO timestamp
   b. If 2xx response: mark as success
   c. If non-2xx or timeout (10s): mark as retrying
   d. Schedule retry with exponential backoff
   e. After 5 failures: mark as failed, notify tenant admin
5. All deliveries logged in WebhookDelivery table
```

### Bidirectional Sync Flow

```
1. Sync config: "Contacts ↔ Salesforce Contacts, every 15 min"
2. Scheduler triggers sync job
3. Outbound (CRM → External):
   a. Query CRM contacts modified since last_sync_at
   b. For each contact:
      - Look up ExternalMapping
      - If exists: update external record
      - If not: create external record, store mapping
   c. Apply field mapping + transformations
4. Inbound (External → CRM):
   a. Query external system for records modified since last_sync_at
   b. For each external record:
      - Look up ExternalMapping
      - If exists: check for conflicts (both modified since last sync)
        - Apply conflict resolution rule
      - If not: create CRM contact, store mapping
   c. Apply field mapping + transformations
5. Log sync results (records synced, errors, conflicts)
6. Update last_sync_at
7. Emit: integration.sync.completed
```

---

## Events Emitted

| Event | Consumers |
|-------|-----------|
| `integration.connected` | Data, Notifications |
| `integration.disconnected` | Notifications |
| `integration.error` | Notifications (admin alert) |
| `integration.sync.completed` | Data (analytics) |
| `webhook.delivery.failed` | Notifications (after max retries) |
| `api.key.created` | Audit |
| `api.key.revoked` | Audit |

---

## API Design Principles

### Standard Request/Response

```
GET /api/v1/contacts?
  filter[lifecycle]=customer&
  filter[company.industry]=Technology&
  sort=-created_at&
  fields=id,first_name,last_name,email,company&
  page[cursor]=eyJpZCI6MTAwfQ&
  page[size]=50

Response:
{
  "data": [...],
  "meta": {
    "total": 1234,
    "next_cursor": "eyJpZCI6MTUwfQ",
    "has_more": true
  }
}
```

### Standard Error Format

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Must be a valid email address"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

### Standard Webhook Payload

```json
{
  "id": "evt_xyz789",
  "type": "contact.created",
  "api_version": "v1",
  "created_at": "2026-03-26T10:00:00Z",
  "data": {
    "object": { /* full contact object */ }
  },
  "metadata": {
    "tenant_id": "t_123",
    "user_id": "u_456"
  }
}
```

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| Webhook delivery at scale | Dedicated worker pool; partition by tenant; circuit breaker per endpoint (pause if consistently failing) |
| Sync engine throughput | Parallel record processing; batch API calls to external systems; rate limit awareness per provider |
| API rate limiting | Redis token bucket per API key; configurable limits; fair queuing |
| OAuth token refresh | Background token refresh before expiry; lock to prevent concurrent refreshes |
| Large initial syncs | Paginated import; progress tracking; resumable from last checkpoint on failure |
| External API rate limits | Per-provider rate limiter; backoff on 429 responses; queue to smooth out bursts |
