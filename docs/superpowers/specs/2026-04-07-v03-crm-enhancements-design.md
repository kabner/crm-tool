# v0.3 CRM Enhancements — Design Spec

## Overview

UX and data model improvements across Contacts, Companies, Deals (renamed Pipelines), and Settings. Addresses search/filter redesign, phone formatting, lifecycle stage ownership changes, and pipeline card customization.

## Key Decisions

1. **Contacts require a company association** — lifecycle stage lives on Company only
2. **New `createdById` field** on contacts/companies — auto-set on creation, displayed as "Created By" (replaces "Owner" label)
3. **Deal cards show "Lifecycle Stage"** (from the associated company) instead of a "Type" field
4. **Settings pages scaffolded for all sections** — only Contacts, Companies, Pipelines populated now; others are blank placeholders

---

## 1. Contacts Changes

### 1.1 Search Fix — Full Name Search
- **Problem:** Searching "John Smith" returns nothing because backend only searches firstName OR lastName independently
- **Fix:** Backend search service must split search term on spaces and match firstName ILIKE first-part AND lastName ILIKE second-part, in addition to existing single-field searches
- **Scope:** `contacts.service.ts` search query builder

### 1.2 Phone Number Formatting
- **Display format:** `+1-(xxx)-xxx-xxxx` everywhere phone appears (table, detail page, etc.)
- **Input:** Country code selector with emoji flag + country code prefix, then phone number input
- **Storage:** Store raw E.164 format (e.g., `+15551234567`) in DB, format on display
- **Shared:** Same component used for Contacts and Companies

### 1.3 Company Field on Every Contact
- **Contacts now require a company association** (per decision #1)
- **Contact form:** Company field is required, uses entity search with inline creation
- **Table:** Company column always visible
- **Detail page:** Company shown prominently

### 1.4 Lifecycle Stage → Company Only
- **DB migration:** Add `lifecycleStage` column to `companies` table (varchar, default 'lead')
- **DB migration:** Remove `lifecycleStage` from `contacts` table (after migrating data)
- **Migration strategy:** For each contact with a company, copy contact's lifecycle stage to company if company doesn't have one yet. For contacts without a company, the stage is lost (acceptable since we're requiring companies now)
- **API:** Remove lifecycle stage from contact DTOs, add to company DTOs
- **Frontend:** Contact table/detail shows lifecycle stage from associated company (read-only on contact). Company form/table gets lifecycle stage field.

### 1.5 Owner → Created By
- **DB migration:** Add `createdById` column (uuid, nullable, FK to users) to contacts and companies tables
- **Seed/migration:** Backfill `createdById` from `ownerId` for existing records
- **API:** Auto-set `createdById = currentUser.id` on creation. Field is read-only after creation.
- **Display:** Show as "Created By" with "FirstName LastName" format. Fallback to "System" if null.
- **Note:** `ownerId` field remains in DB but is no longer displayed as "Owner"

### 1.6 Search & Filter Redesign
- **Layout:** Single search bar + filter icon button to the right
- **Search scope:** Name, company, email, phone, associated deal name
- **Filter popup:** Click filter icon → popover/dialog listing all contact schema fields → select field, enter value/parameters → click "Filter" button to apply
- **Filter pills:** Applied filters appear as pills between search bar and table. Hover shows "x" to remove.
- **Multiple filters:** Click filter icon again to add more
- **Saved filter groups:** Users can save current filter set with a name, quickly apply saved filters. Uses existing SavedView infrastructure.

### 1.7 Create Contact Modal
- "Cancel" button placed next to "Create Contact" button on the card

### 1.8 Column Sorting
- All table columns sortable (click header to toggle ASC/DESC)
- Visual indicator (arrow) on sorted column

### 1.9 Column Customization
- Column picker UI to add/remove columns from available contact schema fields
- Persisted via saved views

### 1.10 Record Count
- Next to "Contacts" header: smaller text showing count
- No filters: "X records"
- With filters: "X records of Y total"

### 1.11 Favorites
- Star icon on each contact row (toggle)
- DB: `isFavorite` stored per-user (new table: `user_favorites` with userId, entityType, entityId)
- Auto-created saved filter "Favorites" that filters starred contacts

---

## 2. Companies Changes

### 2.1 Phone Number Formatting
- Same as Contacts 1.2 — shared component

### 2.2 Lifecycle Stage on Company
- New field on company entity (see 1.4 migration)
- Company form includes lifecycle stage dropdown
- Company table shows lifecycle stage column
- Company detail page shows lifecycle stage

### 2.3 Search & Filter Redesign
- Same pattern as Contacts 1.6 but for company schema fields
- Search scope: company name, email, phone, associated deal name

### 2.4-2.8 (Parallel to Contacts)
- Create modal cancel button placement
- Column sorting
- Column customization
- Record count display
- Favorites (star companies)

All follow the same patterns as the Contacts equivalents.

---

## 3. Deals → Pipelines

### 3.1 Rename "Deals" to "Pipelines"
- Navigation label: "Pipelines" instead of "Deals"
- Page header: "Pipelines"
- Route stays `/deals` (avoid breaking change) but display name changes everywhere

### 3.2 Multiple Pipelines + Dropdown
- Already partially implemented — pipeline selector dropdown exists
- Ensure creating new pipelines is accessible from the page

### 3.3 "All Opportunities" Default View
- Virtual pipeline that aggregates all deals across all pipelines
- Shows as first option in pipeline dropdown
- Kanban columns = union of all stages across pipelines (grouped by pipeline)
- Or: flat list view showing all deals with pipeline column

### 3.4 Card Customization (Settings)
- Settings → Pipelines section: card field configuration
- Default fields: Opportunity Name, Value, Lifecycle Stage, Company Name, Opportunity Owner
- Users can add/remove/reorder fields from deal + related entity schema
- Stored per-user in user preferences or settings table

### 3.5 Card Footer Icons
- Bottom of each card: calendar icon, checkmark icon, owner avatar
- **Calendar:** Shows next scheduled action date (e.g., "Oct 2"). Click expands inline to show details.
- **Checkmark:** Shows count of outstanding tasks. Click expands inline with:
  - Outstanding tasks with checkboxes
  - "Add Task" button
  - Completed tasks below with filled checkboxes
- **Owner avatar:** Small image/initials of opportunity owner

### 3.6 Inline Card Expansion
- Cards expand in-place (not a modal or side panel) when clicking footer icons
- Smooth expand/collapse animation

---

## 4. Settings

### 4.1 Section-Specific Settings
Pages scaffolded for: CRM (Contacts/Companies), Pipelines, Marketing, Service, Content, Commerce, Data, Integrations
- Only CRM and Pipelines populated with actual settings
- Others show "Coming soon" or blank state

### 4.2 User Management
- List users in the tenant
- Add/invite new users
- Assign roles
- Deactivate users
- Uses existing RBAC infrastructure

### 4.3 Account Settings
- Current user can update: first name, last name, email, avatar, timezone
- Change password (existing endpoint)

---

## Data Model Changes

### New Table: `user_favorites`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| user_id | uuid | FK users |
| entity_type | varchar | 'contact', 'company' |
| entity_id | uuid | FK to entity |
| created_at | timestamp | auto |

Unique constraint on (user_id, entity_type, entity_id).

### Modified: `companies`
- Add `lifecycle_stage` varchar default 'lead'

### Modified: `contacts`
- Add `created_by_id` uuid nullable FK users
- Add `company_id` uuid not-null FK companies (require company)
- Remove `lifecycle_stage` (after data migration)

### Modified: `companies`
- Add `created_by_id` uuid nullable FK users

### New Table: `user_settings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tenant_id | uuid | FK tenants |
| user_id | uuid | FK users |
| section | varchar | e.g., 'pipelines' |
| settings | jsonb | arbitrary settings JSON |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

Unique constraint on (user_id, section).

---

## Shared Components

1. **PhoneInput** — Country code selector (emoji flag + code) + phone number field
2. **PhoneDisplay** — Formats stored E.164 to `+1-(xxx)-xxx-xxxx`
3. **FilterBar** — Search input + filter icon + filter popover + pills
4. **ColumnPicker** — Popover to select visible columns
5. **SortableTableHeader** — Click-to-sort column headers with direction indicators
6. **FavoriteButton** — Star toggle icon
7. **RecordCount** — "X records" / "X records of Y total" display

---

## Testing Strategy

Each v0.3.md checklist item will have corresponding tests:
- **Backend:** API endpoint tests for new/modified endpoints (search, filters, favorites, settings)
- **Frontend:** Component tests for new shared components
- **Integration:** Full flow tests for critical paths (create contact with company, filter and save view, pipeline card interactions)
