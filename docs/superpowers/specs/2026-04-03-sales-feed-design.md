# Sales Feed — Design Spec

## Overview

Add a Copper CRM-inspired Sales Feed as the new landing page for the Sales nav group. A new `/sales` route that shows a unified activity stream with sidebar summary — giving sales teams a real-time view of all relationship activity.

## Layout

**Option A (selected): Feed + Sidebar Summary**

- Left: scrollable activity feed (flex: 1)
- Right: fixed 280px sidebar with daily summary stats card + upcoming tasks card
- Top: tab bar (Following / All Activity / Tasks) + filter chips + "Log Activity" button

## Tabs

### Following Tab (default)
- Shows activities where the associated deal is owned by the current user
- Proxy for "records I follow" — uses deal ownership as the initial filter
- Falls back to `userId` filter on the activities API: `GET /api/v1/activities?userId={currentUser}&limit=20&sort=createdAt&order=DESC`

### All Activity Tab
- Shows all activities across the tenant, no user filter
- `GET /api/v1/activities?limit=20&sort=createdAt&order=DESC`

### Tasks Tab
- Shows current user's tasks (type=task, incomplete)
- Uses existing `GET /api/v1/activities/tasks/upcoming` endpoint
- Adds overdue tasks (past due, not completed) — query: `GET /api/v1/activities?type=task&userId={currentUser}&completed=false&sort=dueDate&order=ASC`
- Task items have completion checkboxes using existing `PATCH /api/v1/activities/:id/complete`

## Filters

- **Activity Type**: dropdown/chips to filter by note, call, email, meeting, task
- **User**: dropdown to filter by team member (uses `userId` query param)
- Both filters apply on top of the active tab's base query

## Feed Items

Each feed item displays:
- **User avatar** (initials circle, colored by user)
- **Action description**: "{User Name} {verb} {optional: linked entity name}" — e.g., "Jane Doe logged a call with Bob Wilson"
- **Relative timestamp**: "2m ago", "1h ago", "yesterday"
- **Content preview**: body text, truncated to 2 lines
- **Deal stage changes**: show old → new stage with deal name and amount
- **Entity links**: contact/company/deal names are clickable links to their detail pages

### Activity Type → Verb Mapping
| Type | Verb | Icon |
|------|------|------|
| note | added a note | FileText (gray) |
| call | logged a call | Phone (blue) |
| email | sent an email | Mail (purple) |
| meeting | logged a meeting | Calendar (amber) |
| task | created a task | CheckSquare (emerald) |

## Right Sidebar

### Today's Summary Card
- Aggregated from activities API with date filter for today
- Stats: Activities logged, Calls made, Emails sent, Tasks completed
- Computed client-side from a single `GET /api/v1/activities?limit=100&createdAfter={todayStart}` query (good enough for v1)

### Upcoming Tasks Card
- Reuses existing `GET /api/v1/activities/tasks/upcoming` endpoint (returns max 10)
- Each task shows: subject, due date (relative), completion checkbox
- "View all" link to Tasks tab

## Log Activity Dialog

- Triggered by "+ Log Activity" button in the header
- Reuses the existing `CreateActivityInput` shape
- Fields: Type (dropdown), Subject, Body (optional), Contact (search), Company (search), Deal (search)
- Calls `POST /api/v1/activities`
- On success: invalidate activities query cache, close dialog

## API Changes

**None required.** The existing activities API already supports all needed queries:
- `GET /api/v1/activities` with filters: `type`, `userId`, `page`, `limit`, `sort`, `order`
- `GET /api/v1/activities/tasks/upcoming` for sidebar tasks
- `POST /api/v1/activities` for logging new activities
- `PATCH /api/v1/activities/:id/complete` for task completion

The "today's summary" is computed client-side. No new backend endpoints needed.

## Navigation Changes

Add "Feed" as the first item in the Sales nav group in `apps/web/src/app/(dashboard)/layout.tsx`:

```
Sales
  └─ Feed       ← NEW (href: /sales, icon: Activity)
  └─ Deals
  └─ Sequences
  └─ Lists
```

## New Files

| File | Purpose |
|------|---------|
| `apps/web/src/app/(dashboard)/sales/page.tsx` | Sales Feed page (tabs, filters, feed list, sidebar) |
| `apps/web/src/app/(dashboard)/sales/components/feed-item.tsx` | Single feed item card component |
| `apps/web/src/app/(dashboard)/sales/components/feed-sidebar.tsx` | Right sidebar (summary + tasks) |
| `apps/web/src/app/(dashboard)/sales/components/log-activity-dialog.tsx` | Dialog for logging new activities |
| `apps/web/src/hooks/use-feed.ts` | React Query hooks for feed data (wraps useActivities with tab/filter logic) |

## Modified Files

| File | Change |
|------|--------|
| `apps/web/src/app/(dashboard)/layout.tsx` | Add "Feed" nav item to Sales section |

## Tech

- React Query for all data fetching (reuses existing `apiClient`)
- Radix UI Dialog for Log Activity
- Tailwind CSS for styling (matches existing design system)
- `date-fns` or inline relative time formatting (check what's already used)
- Pagination: "Load more" button at bottom of feed (not traditional pagination)

## Out of Scope (v1)

- Explicit follow/unfollow of records (Following tab uses deal ownership)
- Real-time updates (polling or WebSocket) — manual refresh for now
- Inline email reply from feed
- Pinning notes
- Saved/shared filter configurations
- Deal stage change events as distinct feed items (would need audit log integration)
