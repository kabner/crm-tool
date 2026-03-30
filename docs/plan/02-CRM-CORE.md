# 02 — CRM Core Module

## Overview

The CRM Core is the foundation of the entire platform. It manages the fundamental objects — **contacts, companies, deals, and activities** — that every other module depends on. Think of it as the "source of truth" for who your customers are and every interaction you've had with them.

**Key personas:** Sales reps, account managers, marketing ops, customer success, admins.

**Benchmark tools:** HubSpot CRM, Salesforce CRM, Pipedrive, Close, Attio.

---

## Feature Inventory

### 2.1 Contacts

| Feature | Description | Priority |
|---------|-------------|----------|
| **Contact records** | Full profile: name, email(s), phone(s), address, job title, social links | P0 |
| **Unified timeline** | Chronological stream of ALL interactions: emails, calls, meetings, deals, tickets, page views, form submissions, purchases | P0 |
| **Custom properties** | Admin-defined fields: text, number, date, dropdown, multi-select, checkbox, currency, formula, rollup | P0 |
| **Property groups** | Organize custom properties into logical groups (e.g., "Qualification Info", "Billing Details") | P1 |
| **Contact ownership** | Assign contacts to specific users/teams with ownership transfer workflows | P0 |
| **Lifecycle stages** | Configurable stages: Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist | P0 |
| **Lead status** | Sub-status within lifecycle: New, Attempting Contact, Connected, Qualified, Unqualified | P0 |
| **Duplicate detection** | Fuzzy matching on name + email + phone + company; merge UI with field-by-field resolution | P0 |
| **Merge contacts** | Combine duplicates preserving all history from both records | P0 |
| **Contact scoring** | Configurable scoring model based on demographics + behavior (detail in Sales module) | P1 |
| **Smart lists / segments** | Dynamic lists based on any property or behavior filter (AND/OR logic, nested groups) | P0 |
| **Static lists** | Manual or import-based lists for one-off campaigns | P0 |
| **Bulk actions** | Select multiple contacts → bulk edit, assign, add to list, enroll in sequence, export, delete | P0 |
| **Import/export** | CSV import with field mapping, duplicate handling options; CSV/Excel export | P0 |
| **Contact enrichment** | Auto-fill company, social, job title from email domain (via Clearbit/Apollo-style integration or built-in) | P2 |
| **Gravatar/avatar** | Auto-fetch profile images | P1 |
| **Communication preferences** | Email opt-in/out, SMS consent, preferred channel, do-not-contact flags | P0 |
| **Tags** | Freeform tags for flexible categorization | P1 |
| **Notes** | Rich-text notes on contacts with @mentions for team members | P0 |
| **Pinned activities** | Pin important notes or activities to the top of the timeline | P1 |

### 2.2 Companies

| Feature | Description | Priority |
|---------|-------------|----------|
| **Company records** | Name, domain, industry, size, revenue, address, description, social links | P0 |
| **Company-contact association** | Many-to-many: a contact can belong to multiple companies (consultant, advisor) | P0 |
| **Primary company** | Designate one company as the contact's primary affiliation | P0 |
| **Parent/child companies** | Hierarchical org structure (e.g., subsidiary → parent corporation) | P1 |
| **Company timeline** | Aggregated timeline from all associated contacts + company-level activities | P0 |
| **Company custom properties** | Same custom field system as contacts | P0 |
| **Company ownership** | Assign to user/team | P0 |
| **Domain-based auto-association** | New contacts auto-linked to company by email domain | P0 |
| **Company enrichment** | Auto-fill from domain: logo, employee count, industry, funding, tech stack | P2 |
| **Account-based views** | See all contacts, deals, tickets, and engagement at the company level | P0 |

### 2.3 Deals

| Feature | Description | Priority |
|---------|-------------|----------|
| **Deal records** | Name, amount, close date, stage, pipeline, owner, priority | P0 |
| **Multiple pipelines** | Different pipelines for different sales processes (New Business, Upsell, Partner) | P0 |
| **Custom deal stages** | Configurable stages per pipeline with win probability % | P0 |
| **Deal associations** | Link to contacts (with roles: decision-maker, influencer, etc.) and companies | P0 |
| **Deal custom properties** | Same custom field system | P0 |
| **Required fields per stage** | Enforce data quality: "Budget" required to enter Negotiation stage | P1 |
| **Deal timeline** | All activities related to the deal | P0 |
| **Weighted pipeline value** | Amount × probability for forecasting | P0 |
| **Deal products** | Associate line items / products with a deal (bridge to Commerce) | P1 |
| **Win/loss reasons** | Capture why deals were won or lost | P0 |
| **Deal rotting** | Visual indicator when a deal has been idle too long per stage | P1 |
| **Deal splits** | Credit multiple reps for a single deal (for compensation) | P2 |

### 2.4 Activities

| Feature | Description | Priority |
|---------|-------------|----------|
| **Activity types** | Calls, emails, meetings, tasks, notes, custom types | P0 |
| **Activity logging** | Log activities manually or automatically (email tracking, call integration) | P0 |
| **Tasks** | Assignable to-do items with due dates, priority, status, reminders | P0 |
| **Task queues** | Ordered lists of tasks for focused work (inspired by HubSpot task queues) | P1 |
| **Meetings** | Schedule meetings with calendar integration, meeting links, and outcome logging | P1 |
| **Call logging** | Log calls with duration, outcome, recording link, notes | P0 |
| **Email tracking** | Track opens, clicks on sent emails (pixel + link wrapping) | P0 |
| **Activity reminders** | In-app + email reminders for upcoming/overdue tasks | P0 |
| **Recurring tasks** | Tasks that auto-regenerate on a schedule | P1 |

### 2.5 Views & Filters

| Feature | Description | Priority |
|---------|-------------|----------|
| **Table view** | Spreadsheet-like view with sortable/filterable columns (like Attio/Airtable) | P0 |
| **Board view** | Kanban board for deals and lifecycle stages | P0 |
| **Saved views** | Save filter + column configurations, share with team | P0 |
| **Advanced filters** | AND/OR groups, nested conditions, across related objects ("contacts whose company has > 50 employees AND who opened an email in the last 7 days") | P0 |
| **Column customization** | Show/hide/reorder columns, resize | P0 |
| **Quick filters** | One-click filters: "My contacts", "Created this week", "No activity in 30 days" | P1 |
| **Inline editing** | Edit fields directly in table view without opening the record | P0 |

### 2.6 Admin & Configuration

| Feature | Description | Priority |
|---------|-------------|----------|
| **Custom properties manager** | Create, edit, archive custom fields with types, validation, default values | P0 |
| **Pipeline configuration** | Create/edit pipelines, stages, win probabilities | P0 |
| **Lifecycle stage configuration** | Customize stages and transition rules | P0 |
| **Data model settings** | Configure required fields, default values, property visibility per team | P1 |
| **Import history** | Track past imports with undo capability | P1 |
| **Recycle bin** | Soft-deleted records recoverable for 90 days | P0 |

---

## Data Model

### Core Entities

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   Contact    │──M:N──│ContactCompany    │──M:N──│   Company    │
│              │       │ (role, primary)  │       │              │
│ id           │       └─────────────────┘       │ id           │
│ tenant_id    │                                  │ tenant_id    │
│ first_name   │       ┌─────────────────┐       │ name         │
│ last_name    │──M:N──│  ContactDeal     │       │ domain       │
│ email        │       │  (role)          │       │ industry     │
│ phone        │       └───────┬─────────┘       │ size         │
│ lifecycle    │               │                  │ parent_id    │→ self
│ lead_status  │               │                  │ owner_id     │
│ owner_id     │               ▼                  │ custom_props │ (JSONB)
│ custom_props │ (JSONB) ┌─────────────┐         └─────────────┘
│ tags         │ (text[])│    Deal      │
│ created_at   │         │              │
│ updated_at   │         │ id           │
└──────┬───────┘         │ tenant_id    │
       │                 │ name         │
       │                 │ amount       │
       ▼                 │ stage_id     │→ DealStage
┌─────────────┐         │ pipeline_id  │→ Pipeline
│  Activity    │         │ close_date   │
│              │         │ owner_id     │
│ id           │         │ won          │
│ tenant_id    │         │ lost_reason  │
│ type         │         │ custom_props │ (JSONB)
│ subject      │         └─────────────┘
│ body         │
│ contact_id   │→ Contact
│ company_id   │→ Company (optional)
│ deal_id      │→ Deal (optional)
│ user_id      │→ User (who performed)
│ due_date     │
│ completed_at │
│ metadata     │ (JSONB)
│ created_at   │
└─────────────┘

┌─────────────┐         ┌─────────────┐
│  Pipeline    │──1:M──▶│ DealStage   │
│              │         │             │
│ id           │         │ id          │
│ tenant_id    │         │ pipeline_id │
│ name         │         │ name        │
│ is_default   │         │ position    │
│ created_at   │         │ probability │
└─────────────┘         │ required_fields│ (text[])
                         └─────────────┘

┌─────────────────┐
│  CustomProperty  │
│                  │
│ id               │
│ tenant_id        │
│ object_type      │  (contact, company, deal)
│ name             │
│ label            │
│ field_type       │  (text, number, date, dropdown, etc.)
│ options          │  (JSONB — for dropdown/multi-select)
│ group            │
│ required         │
│ default_value    │
│ position         │
│ archived         │
└─────────────────┘

┌─────────────────┐
│    SavedView     │
│                  │
│ id               │
│ tenant_id        │
│ user_id          │  (null = shared)
│ object_type      │
│ name             │
│ filters          │  (JSONB)
│ columns          │  (JSONB)
│ sort             │  (JSONB)
│ view_type        │  (table, board)
│ is_default       │
└─────────────────┘

┌─────────────────┐
│  List           │
│                 │
│ id              │
│ tenant_id       │
│ name            │
│ type            │  (smart / static)
│ filters         │  (JSONB — for smart lists)
│ created_by      │
└─────────────────┘

┌─────────────────┐
│  ListMembership │
│                 │
│ list_id         │
│ contact_id      │
│ added_at        │
│ source          │  (manual, import, automation)
└─────────────────┘
```

### Custom Properties via JSONB

Instead of the EAV (Entity-Attribute-Value) pattern, custom properties are stored as a JSONB column on each entity:

```json
// contact.custom_props
{
  "lead_source": "Google Ads",
  "annual_budget": 50000,
  "renewal_date": "2027-01-15",
  "preferred_features": ["analytics", "automation"],
  "is_partner": true
}
```

Benefits:
- No JOINs for custom field access
- Full indexing via GIN indexes: `CREATE INDEX idx_contact_custom ON contacts USING GIN (custom_props)`
- Queryable: `WHERE custom_props->>'lead_source' = 'Google Ads'`
- Performant at scale (PostgreSQL JSONB is binary, not text)

Trade-off: Schema validation moves to the application layer (enforced by CustomProperty definitions).

---

## Key Workflows

### Contact Creation Flow

```
1. User submits contact form (or API call, or import row)
2. Validation: required fields, email format, custom property types
3. Duplicate check: fuzzy match on email (exact), name+company (fuzzy)
   a. If duplicate found → present merge UI (or auto-merge if API flag set)
   b. If no duplicate → proceed
4. Auto-association: look up company by email domain
   a. Company exists → associate
   b. Company doesn't exist → create company stub from domain
5. Assign owner (round-robin, territory rules, or manual)
6. Set initial lifecycle stage (default: "Lead" or per-source configuration)
7. Persist contact
8. Emit events:
   - contact.created
   - contact.assigned (if owner set)
   - contact.associated_with_company (if company linked)
9. Index in OpenSearch
10. Trigger automation rules (marketing module listens for contact.created)
```

### Duplicate Merge Flow

```
1. System identifies potential duplicates (background job or on-create check)
2. User reviews merge candidates
3. For each field: pick value from Record A, Record B, or enter custom
4. System merges:
   a. Winning record retains its ID
   b. All associations (deals, activities, tickets, list memberships) transferred
   c. Losing record soft-deleted with pointer to winner
   d. Timeline merged chronologically
5. Emit: contact.merged { winnerId, loserId }
```

---

## Events Emitted

| Event | Payload | Consumers |
|-------|---------|-----------|
| `contact.created` | Full contact object | Marketing (auto-enroll), Data (analytics), Search (index) |
| `contact.updated` | Contact ID + changed fields | Search (re-index), Marketing (segment recalc) |
| `contact.deleted` | Contact ID | Search (de-index), all modules (cascade cleanup) |
| `contact.merged` | Winner ID, loser ID | Search, all modules |
| `contact.lifecycle_changed` | Contact ID, old stage, new stage | Sales (lead routing), Marketing (nurture triggers) |
| `contact.owner_changed` | Contact ID, old owner, new owner | Notifications |
| `company.created` | Full company object | Search, Data |
| `company.updated` | Company ID + changed fields | Search |
| `deal.created` | Full deal object | Sales (pipeline), Data |
| `deal.stage_changed` | Deal ID, old stage, new stage | Sales (forecasting), Notifications |
| `deal.won` | Deal + amount | Commerce (invoice trigger), Marketing (customer stage) |
| `deal.lost` | Deal + reason | Data (analytics) |
| `activity.created` | Full activity object | Data (engagement scoring), Contact (last activity date) |

---

## Cross-Module Dependencies

| Module | CRM Provides | CRM Consumes |
|--------|-------------|--------------|
| **Sales** | Contact/deal records, pipeline config | Lead scores, sequence enrollment status |
| **Marketing** | Contact lists, lifecycle stages | Campaign engagement data, form submissions, page views |
| **Service** | Contact/company lookup | Ticket history (for timeline) |
| **Content** | Contact data for personalization | Page view events |
| **Data** | All entity data for reporting | Computed properties (e.g., "engagement score") |
| **Commerce** | Contact/company for billing | Purchase history, subscription status |
| **Integrations** | CRUD operations for sync | External data updates |

---

## AI/ML Opportunities

1. **Smart duplicate detection** — ML model trained on merge decisions to improve fuzzy matching confidence
2. **Property auto-fill** — Suggest field values based on similar contacts
3. **Activity summarization** — AI-generated summary of recent interactions on a contact
4. **Next best action** — Recommend what to do next with a contact based on historical patterns
5. **Relationship mapping** — Auto-detect connections between contacts (same company, email threads, meeting co-attendees)

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| 50K+ contacts in a single view | Virtual scrolling + server-side pagination (cursor-based) |
| Complex filter queries | Composite indexes on common filter combinations; OpenSearch for full-text |
| Custom property indexing | GIN index on JSONB; most-queried properties promoted to computed columns |
| Timeline aggregation | Materialized view or denormalized timeline table, updated via events |
| Duplicate detection at scale | Background job with batched comparison; LSH (Locality-Sensitive Hashing) for fuzzy matching |
| Bulk operations (10K+ records) | Async job queue with progress tracking; chunked DB operations |
