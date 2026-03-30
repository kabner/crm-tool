# 11 — Mobile & UX Strategy

## Overview

Web is the primary platform, but the architecture is designed for eventual mobile (React Native). This document covers the design system, responsive web strategy, PWA approach, and mobile app feature priorities.

---

## 11.1 Design System

Built on **shadcn/ui** (Radix + Tailwind CSS) for accessibility and consistency.

### Core Components

| Category | Components |
|----------|------------|
| **Layout** | Sidebar nav, top bar, page shell, split pane, responsive grid |
| **Navigation** | Sidebar (collapsible), breadcrumbs, tabs, command palette (Cmd+K) |
| **Data display** | Data table (sortable, filterable, virtual scroll), card, timeline, stat card, badge, avatar |
| **Forms** | Input, select, multi-select, date picker, rich text editor, file upload, toggle, color picker |
| **Feedback** | Toast, alert, dialog, confirmation modal, progress bar, skeleton loader |
| **Overlays** | Modal, drawer (side panel), popover, tooltip, dropdown menu |
| **Custom** | Pipeline board (kanban), workflow builder canvas, email composer, chart widgets |

### Design Tokens

```
Colors: primary, secondary, accent, destructive, muted, background, foreground
  — Supports dark mode toggle
  — Tenant-customizable primary color

Typography: font-sans (Inter), font-mono (JetBrains Mono)
  — Scale: xs, sm, base, lg, xl, 2xl, 3xl

Spacing: 4px base unit (0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)

Radius: sm (2px), md (6px), lg (12px), full (9999px)

Shadows: sm, md, lg (used sparingly — prefer borders)
```

### Keyboard-First Design (Inspired by Linear & Superhuman)

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Command palette — search anything, navigate, run actions |
| `G then C` | Go to Contacts |
| `G then D` | Go to Deals |
| `G then T` | Go to Tickets |
| `C` | Create new (context-aware: contact on contacts page, deal on deals page) |
| `E` | Edit selected record |
| `/` | Focus search/filter |
| `J/K` | Navigate up/down in lists |
| `Enter` | Open selected |
| `Escape` | Close modal/panel, deselect |
| `Cmd+Shift+.` | Open notification panel |
| `?` | Show keyboard shortcut reference |

---

## 11.2 Responsive Web Strategy

The web app is fully responsive across breakpoints:

| Breakpoint | Target | Layout Adjustments |
|------------|--------|--------------------|
| `≥1280px` | Desktop | Full sidebar + main content + optional detail panel |
| `1024-1279px` | Small desktop | Collapsible sidebar; detail panel as overlay |
| `768-1023px` | Tablet | Sidebar as drawer; single-column layout |
| `<768px` | Mobile web | Bottom nav; full-screen views; simplified tables |

### Responsive Patterns

| Pattern | Desktop | Mobile |
|---------|---------|--------|
| **Navigation** | Persistent sidebar | Bottom tab bar + hamburger menu |
| **Data tables** | Full table with all columns | Card view or priority columns only |
| **Detail view** | Side panel (split view) | Full-screen page |
| **Pipeline board** | Multi-column kanban | Horizontal swipe between stages |
| **Forms** | Multi-column layout | Single-column stacked |
| **Dashboards** | Grid of widgets | Stacked single-column |
| **Email composer** | Side-by-side preview | Full-screen editor, separate preview |

---

## 11.3 PWA (Progressive Web App)

Before building a native mobile app, a PWA provides mobile-quality experience:

| Feature | Description | Priority |
|---------|-------------|----------|
| **Installable** | Add to home screen on iOS/Android | P1 |
| **App shell** | Instant load with cached shell; content loaded dynamically | P1 |
| **Offline support** | View recently accessed contacts/deals offline; queue mutations for sync | P2 |
| **Push notifications** | Web push for deal updates, ticket assignments, task reminders | P1 |
| **Background sync** | Sync queued actions when connection restored | P2 |
| **Share target** | Share content to CRM from other apps | P2 |

---

## 11.4 Native Mobile App (Future — React Native)

### Phase 1 — Essential Mobile Features

Focused on what mobile users need most (field sales, on-the-go management):

| Feature | Description |
|---------|-------------|
| **Contact lookup** | Quick search, view contact details and timeline |
| **Call logging** | After a phone call, quickly log notes and outcome |
| **Activity feed** | Personal activity timeline: tasks due, meetings, notifications |
| **Task management** | View, complete, create tasks |
| **Deal board** | View pipeline; move deals between stages |
| **Push notifications** | Real-time alerts for assignments, mentions, deal changes |
| **Quick actions** | Floating action button: log call, create task, add note |
| **Business card scan** | Camera → OCR → create contact |
| **Offline mode** | View cached data; queue mutations |

### Phase 2 — Extended Mobile Features

| Feature | Description |
|---------|-------------|
| **Ticket management** | View and respond to tickets |
| **Email** | Read and reply to contact emails |
| **Meeting prep** | Quick view of upcoming meeting with contact context |
| **Dashboard widgets** | Key metrics as home screen widgets |
| **Chat support** | Respond to live chats from mobile |
| **Location features** | Nearby contacts/companies on a map (for field sales) |
| **Voice notes** | Record voice memo attached to contact |

### React Native Architecture

```
mobile/
├── src/
│   ├── navigation/      # React Navigation (stack, tab, drawer)
│   ├── screens/         # Screen components (one per route)
│   ├── components/      # Shared components (may share design tokens with web)
│   ├── stores/          # Zustand stores (shared logic with web where possible)
│   ├── api/             # Same auto-generated API client as web
│   ├── hooks/           # TanStack Query hooks (reused from web)
│   ├── utils/           # Utilities
│   └── offline/         # SQLite cache, sync queue, conflict resolution
├── ios/
├── android/
└── app.json
```

Code sharing strategy:
- **Shared:** API client, types, business logic hooks, validation schemas (Zod)
- **Platform-specific:** Navigation, UI components, native features (camera, push)

---

## 11.5 Notification System

Unified notification system across web and mobile:

### Notification Types

| Type | Channels | Examples |
|------|----------|---------|
| **Assignment** | In-app, push, email | "You were assigned ticket T-1234" |
| **Mention** | In-app, push, email | "Jane mentioned you in a note on Contact X" |
| **Task reminder** | In-app, push, email | "Task due in 1 hour: Follow up with Client Y" |
| **Deal update** | In-app, push | "Deal moved to Negotiation stage" |
| **SLA warning** | In-app, push, email | "Ticket T-5678 will breach SLA in 30 minutes" |
| **Email activity** | In-app | "John opened your proposal email" |
| **Form submission** | In-app, push | "New form submission from landing page" |
| **System alert** | In-app, email | "Integration disconnected: Gmail" |
| **Approval request** | In-app, push, email | "Quote Q-100 needs your approval" |

### Notification Preferences

Users configure per notification type:
- **In-app:** Always on (but can mark as read/mute)
- **Email:** On/off per type, digest mode (instant, hourly, daily)
- **Push (web/mobile):** On/off per type
- **Quiet hours:** No push notifications during specified hours

### Notification Data Model

```
┌─────────────────────┐
│   Notification       │
│                      │
│ id                   │
│ tenant_id            │
│ user_id              │  (recipient)
│ type                 │  (assignment, mention, reminder, etc.)
│ title                │
│ body                 │
│ action_url           │  (deep link to relevant page)
│ resource_type        │
│ resource_id          │
│ actor_id             │  (who caused the notification)
│ read_at              │
│ email_sent_at        │
│ push_sent_at         │
│ created_at           │
└──────────────────────┘

┌──────────────────────────┐
│  NotificationPreference   │
│                           │
│ id                        │
│ user_id                   │
│ notification_type         │
│ email_enabled             │
│ email_frequency           │  (instant, hourly, daily)
│ push_enabled              │
│ quiet_hours_start         │
│ quiet_hours_end           │
│ quiet_hours_timezone      │
└───────────────────────────┘
```

---

## 11.6 Accessibility

| Requirement | Implementation |
|-------------|----------------|
| **WCAG 2.1 AA** | Target compliance level |
| **Keyboard navigation** | All features accessible without mouse |
| **Screen reader** | Proper ARIA labels, landmarks, live regions |
| **Color contrast** | 4.5:1 minimum for normal text, 3:1 for large |
| **Focus management** | Visible focus indicators; logical tab order; focus trapping in modals |
| **Motion** | Respect `prefers-reduced-motion`; no auto-playing animations |
| **Text scaling** | UI doesn't break up to 200% zoom |
| **Alt text** | Required on all images; AI-suggested for uploaded assets |
| **Form labels** | All inputs have visible labels; error messages linked to fields |
