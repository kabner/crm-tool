# Copper CRM vs Our CRM — Feature Comparison

## What We Already Match or Exceed Copper On

| Area | Our Implementation | Copper |
|------|-------------------|--------|
| **Contact/Company CRUD** | Full CRUD, custom properties (JSONB), tags, activity timeline | Same |
| **Multiple Pipelines + Kanban** | Multiple pipelines, drag-and-drop board, list view, stage probability | Same |
| **Deal management** | Win/loss tracking, loss reasons, stage movement, priority | Same |
| **Task management** | Tasks with due dates, completion, linked to deals/contacts/companies | Same |
| **Activity logging** | Notes, calls, emails, meetings, tasks with timeline per record | Same |
| **Email engine** | Full email builder, send, open/click tracking, templates, personalization tokens | Copper only has templates + tracking; we have a full builder |
| **Marketing automation** | Visual workflow builder with triggers, branches, waits, goals | **Copper has none** — just basic task triggers |
| **Forms** | Form builder with field types, public submission, embed code | Similar |
| **Lead scoring** | Rule-based scoring, demographic + behavioral, MQL/SQL thresholds | Similar (Copper: Business plan only) |
| **Website tracking** | JS snippet, page views, UTM capture, contact journey | Similar (Copper: Business plan only) |
| **Ticketing / Service desk** | Full ticketing, SLA, canned responses, CSAT | **Copper has none** |
| **Knowledge base** | Categories, sections, articles, search, feedback | **Copper has none** |
| **Live chat** | Session management, agent inbox, convert-to-ticket | **Copper has none** |
| **Content CMS** | Pages, blog, landing pages, block editor, versioning, SEO | **Copper has none** |
| **Asset management** | File upload, folders, image metadata | **Copper has none** |
| **Commerce** | Products, invoicing, payments, subscriptions, MRR/ARR/LTV | **Copper has none** |
| **Reports** | Report builder with data sources, filters, visualization, CSV export | Similar |
| **Dashboards** | Overview dashboard with KPI cards, summaries | Similar |
| **Webhooks** | HMAC-SHA256 signed, retry logic, delivery logs | **Better than Copper** (they have no retries) |
| **API keys** | Scoped keys, bcrypt-hashed, prefix ID, revoke | Similar |
| **RBAC** | 34 permissions, 5 roles, guard | More granular than Copper's Admin/User model |
| **Audit logging** | Automatic mutation logging | Copper has no equivalent |
| **Multi-tenancy** | Row-level security, tenant isolation | Enterprise feature Copper lacks |
| **Saved views** | Save/load filter+column+sort per object type | Similar |
| **Home feed** | Activity + notification stream, emoji reactions | Copper has activity feed per record but no unified home feed with reactions |

---

## What Copper Has That We're Missing

### High Priority (core CRM gaps)

| # | Feature | Copper | Us | Effort |
|---|---------|--------|----|--------|
| 1 | **Gmail/Google Workspace integration** | Full sidebar in Gmail, auto email logging, compose from CRM, Google Calendar sync, Google Contacts sync, Google Drive file linking | None | Large — requires Chrome extension + OAuth + sync engine |
| 2 | **Automatic email logging** | Every sent/received email auto-logged to contact record | Manual only (send from our app) | Medium — needs IMAP/Gmail API polling or webhook |
| 3 | **Contact/company enrichment** | Auto-fills phone, social profiles, company info from web/email signatures | None | Medium — needs third-party data provider (Clearbit, Apollo, etc.) |
| 4 | **Leads as separate entity** | Distinct Lead record with statuses, conversion to Contact+Deal | Contacts only, no lead conversion flow | Medium — new entity, conversion workflow |
| 5 | **Project pipelines** | Post-sale pipeline type for delivery/implementation tracking | Only sales pipelines | Small-Medium — add pipeline `type` field, project templates |
| 6 | **Email sequences** | Multi-step drip campaigns with delays, triggers, reply tracking | We have Sales Sequences already | **Already done** |
| 7 | **Bulk email / mail merge** | Send personalized emails to up to 200 contacts at once | We have list-based sends | **Already done** |
| 8 | **Calendar integration** | Google Calendar sync — meetings auto-logged, scheduling | None | Medium — Google Calendar API + sync |
| 9 | **Mobile app** | iOS + Android with pipeline views, call/text logging, business card scanning, offline notes | None | Large — React Native or similar |
| 10 | **Chrome extension** | CRM sidebar on any website, one-click contact capture from LinkedIn/web | None | Large — Chrome extension with OAuth |

### Medium Priority (UX and workflow gaps)

| # | Feature | Copper | Us | Effort |
|---|---------|--------|----|--------|
| 11 | **Inline editing in list views** | Edit fields directly from table rows without opening detail page | Must navigate to detail page | Small |
| 12 | **Business card scanning** | Snap photo → create contact | None | Medium — OCR integration |
| 13 | **Recurring tasks** | Auto-create tasks on schedule via automation | Manual creation only | Small — add recurrence to task automation |
| 14 | **Subtasks** | Break tasks into smaller steps | Flat task list | Small |
| 15 | **Contact types** | Customizable categories (Customer, Partner, Vendor, etc.) | Just lifecycle stage + lead status | Small — add `contactType` field |
| 16 | **Record-level visibility** | Restrict who can see specific records (Everyone, Team, Only Me, Owner) | Tenant-wide RLS only | Medium |
| 17 | **Bulk merge/dedup** | Select multiple records and merge | None | Medium |
| 18 | **Custom activity types** | Admin-defined types beyond the defaults | Fixed types (note, task, call, email, meeting) | Small |
| 19 | **@mentions in notes** | Tag team members, get notified | Plain text notes | Small-Medium |
| 20 | **File attachments on records** | Attach files to any contact/company/deal | Assets module exists but not linked per-record | Small |

### Lower Priority (nice-to-haves)

| # | Feature | Copper | Us | Effort |
|---|---------|--------|----|--------|
| 21 | **AI email rewriter/generator** | Improve drafts, generate templates with AI | None | Medium — LLM API integration |
| 22 | **AI CRM queries (Copper GPT)** | Natural language queries against CRM data | None | Medium-Large |
| 23 | **LinkedIn integration** | Capture contacts from profiles, sync DMs, email finder | None | Large — LinkedIn API is restricted |
| 24 | **Google Sheets add-on** | Pull CRM data into Sheets | CSV export exists | Small-Medium |
| 25 | **Rename record types** | Customize labels ("People" → "Clients") | Fixed labels | Small |
| 26 | **Multi-currency** | Display and convert multiple currencies | Single currency | Medium |
| 27 | **SAML SSO** | Okta integration | JWT only | Medium |
| 28 | **Pipeline-specific custom fields** | Different fields per pipeline | Same fields everywhere | Small-Medium |
| 29 | **Formula fields in automations** | CONCAT, IF, DATEADD, etc. in workflow actions | No formula support | Medium |
| 30 | **Slack integration — bidirectional** | Rich notifications + actions from Slack | Webhook notifications only (one-way) | Medium |

---

## Summary Scorecard

| Category | Us | Copper | Winner |
|----------|-----|--------|--------|
| CRM Core (contacts/companies) | 4/5 | 5/5 | Copper (enrichment, Gmail, leads) |
| Pipelines & Deals | 5/5 | 4/5 | Us (card customization, inline tasks) |
| Email & Communication | 4/5 | 5/5 | Copper (Gmail native, auto-logging) |
| Tasks & Activities | 4/5 | 4/5 | Tie |
| Automation | 5/5 | 3/5 | **Us** (visual workflow builder) |
| Reporting | 4/5 | 4/5 | Tie |
| Marketing | 5/5 | 1/5 | **Us** (full marketing suite) |
| Service & Support | 5/5 | 0/5 | **Us** (Copper has nothing) |
| Content | 4/5 | 0/5 | **Us** (Copper has nothing) |
| Commerce | 4/5 | 0/5 | **Us** (Copper has nothing) |
| Integrations | 3/5 | 5/5 | Copper (Google native, Chrome ext) |
| Mobile | 0/5 | 4/5 | Copper |
| AI Features | 0/5 | 3/5 | Copper |

---

## Recommended Priority to Reach Copper Parity

### Phase 1 — Close the core CRM gaps
1. Leads entity with conversion flow
2. Project pipelines (post-sale)
3. Inline editing in list views
4. Contact types, custom activity types, subtasks
5. File attachments per record
6. Bulk merge/dedup tool

### Phase 2 — Email & calendar integration
7. Google Calendar sync (meetings auto-logged)
8. Automatic email logging (Gmail API or IMAP)
9. Contact enrichment (third-party data provider)

### Phase 3 — Platform extensions
10. Chrome extension (CRM sidebar in Gmail/web)
11. AI features (email rewriter, CRM queries)
12. Mobile app (iOS + Android)

Phases 1 and 2 would put us at functional parity with Copper's Professional plan while retaining our massive advantages in marketing, service, content, and commerce that Copper doesn't touch. Phase 3 is what makes Copper sticky (the Gmail experience) and would be the longer investment.

---

## Copper CRM — Full Feature Reference

### CRM Core
- Centralized contact database with all emails, calls, files, notes per contact
- Automatic contact creation from Gmail — one-click add from sidebar
- Contact enrichment — auto-fills phone, social profiles, company info
- Business card scanning on mobile
- Contact types — customizable categories (Customer, Partner, Vendor, etc.)
- Tags for flexible grouping
- Activity feed per contact with "Following" filter (your activities vs all)
- Contact limits by plan: Starter 1,000 / Basic 2,500 / Professional 15,000 / Business Unlimited
- Company records linked to people with company-level activity feed
- Separate Lead entity (Professional+) with statuses, conversion to Contact+Deal, lead sources
- 11 custom field types (checkbox, currency, dropdown, multi-select, date, text, text area, number, URL, percentage, connect)
- Field sections, drag-and-drop ordering, visibility toggles
- Pipeline-specific fields (Basic+)
- CSV/Excel import (3MB max) with field mapping, duplicate handling, update-on-import
- Bulk merge for manual deduplication
- Export to CSV

### Pipeline & Deals
- Multiple pipelines for different processes
- Custom stages per pipeline with drag-and-drop reordering
- Win probability percentage per stage
- Kanban board + list view toggle
- Pipeline card customization (admin defaults + user personalization)
- Deal values, expected close dates, loss reasons (customizable dropdown)
- Deal owner/assignee
- Multi-currency (Business plan only)
- Project pipelines — post-sale delivery with stages, linked to opportunities, templates
- Pipeline reporting: health dashboards, stage conversion, deal velocity, win/loss analysis, inactivity tracking

### Email & Communication
- Full Gmail sidebar — view contacts, deals, tasks, notes while reading email
- Automatic email logging — every sent/received email auto-logged
- One-click contact add from any email
- Email compose from CRM
- Email templates with merge fields/personalization tokens
- AI email template generator and AI email rewriter
- Open and click tracking (Professional+)
- Bulk email / mail merge to 200 contacts at once (Professional+)
- Email sequences with multi-step drip, configurable delays, reply tracking (Business only)

### Task & Activity Management
- Tasks with name, due date, assignee, activity type
- Activity types: phone call, meeting, email, to-do (plus custom types)
- Task list view organized by owner, record, or due date
- Tasks linked to contacts, companies, opportunities, projects
- Subtasks
- Recurring tasks via automation
- Automatic email and calendar event logging from Google
- Manual activity logging (notes, calls, meetings)
- Mobile auto-logging of calls and SMS
- Custom activity types defined by admins
- Follow-up reminders, due date notifications
- Notes on any record, comments and reactions, file attachments

### Automation & Workflows
- Task automation (Basic+): if/then logic creates follow-up tasks on events
- Workflow automation (Professional+): trigger + action model
- Trigger events: record created, updated, field changed, daily recurring
- Trigger conditions with AND/OR/custom logic
- Actions: create record, update record fields
- Formula functions: CONCAT, UPPER, LOWER, SUM, AVG, ROUND, CURRENTDATE, DATEADD, DAYS, IF, ISBLANK, GETVALUE
- Admin-only creation, works across web/mobile/extension/API/imports

### Reporting & Analytics
- Pipeline health dashboard, win rate, average deal size, time-to-close
- Stage conversion analysis, deal velocity, inactivity detection
- Activity reports by type, user, time period
- Custom report builder (Business only) with filters, visualizations, export, scheduled delivery
- Pre-built dashboard layouts, customizable KPIs
- Sales history and forecasting based on pipeline + win probability
- Google Sheets add-on and Looker Studio integration (Professional+)

### Integrations
- Google Workspace: Gmail, Calendar, Drive, Contacts, Sheets, Looker Studio
- Native: Zapier, Dropbox, DocuSign, Mailchimp, QuickBooks, PandaDoc, JustCall, RingCentral, Slack, Zendesk
- LinkedIn (Business): contact capture, DM sync, AI summaries, email finder
- RESTful API with OAuth 2.0, full CRUD, bulk operations, Postman collection
- Up to 100 webhook subscriptions (fire-and-forget, no retries)

### UI/UX
- Google Workspace-native design
- Left sidebar navigation
- Record detail pages with tabbed sections (Details, Activity, Related, Files)
- Chrome extension: Gmail sidebar, works on any website, domain popping
- Mobile app: iOS + Android, pipeline views, one-tap actions, business card scanning, voice notes, offline notes, multi-language
- Minimal setup time, Sign in with Google, inline editing, drag-and-drop throughout

### Admin & Settings
- Two core roles: Admin and User, plus Account Owner
- Team creation with Team Manager / Team Member
- Record visibility: Everyone, Teams, Individuals, Only Me, Record Owner Only (Professional+)
- SAML SSO via Okta (Basic+)
- Rename record types, custom activity types, custom contact types
- Pipeline stage config with win percentages and loss reasons
- Field management with reorder, show/hide, sections
- Multi-currency selection (Business)

### AI Features (2025)
- AI Email Rewriter and Template Generator
- Copper GPT — natural language CRM queries (Professional+)
- LinkedIn Email Finder (beta)
- AI-powered contact enrichment
- Google Gemini integration for email generation
