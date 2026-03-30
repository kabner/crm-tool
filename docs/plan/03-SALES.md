# 03 — Sales Module

## Overview

The Sales module turns raw contacts into revenue. It provides pipeline management, sales automation (sequences), quoting, forecasting, and lead management tools that help sales reps close deals efficiently and sales leaders maintain visibility.

**Key personas:** Sales reps (AEs), SDRs/BDRs, sales managers, VP of Sales, RevOps.

**Benchmark tools:** Salesforce Sales Cloud, HubSpot Sales Hub, Pipedrive, Close, Outreach, SalesLoft, Gong, Apollo.

---

## Feature Inventory

### 3.1 Pipeline Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Kanban board** | Drag-and-drop deal cards across stages; visual pipeline overview | P0 |
| **List view** | Table view of deals with sortable columns, inline editing | P0 |
| **Multiple pipelines** | Separate pipelines for New Business, Renewals, Upsell, Partner, etc. | P0 |
| **Pipeline customization** | Custom stages, colors, win probability per stage, required fields per stage | P0 |
| **Deal card configuration** | Choose which fields display on the kanban card | P1 |
| **Pipeline metrics bar** | Top-of-board summary: total value, weighted value, deal count per stage | P0 |
| **Stage duration tracking** | How long deals spend in each stage; alerts for stale deals | P1 |
| **Deal rotting indicators** | Visual warning when deals exceed expected stage duration | P1 |
| **Pipeline conversion rates** | Stage-to-stage conversion rates with trend lines | P1 |
| **Activity requirements** | Configurable: "Deals in Proposal stage must have an activity every 3 days" | P2 |

### 3.2 Sales Sequences (Outreach Automation)

Inspired by Outreach, SalesLoft, and Apollo.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Sequence builder** | Multi-step automated outreach: emails, tasks, LinkedIn reminders, delays | P0 |
| **Email steps** | Templated emails with merge fields, sent from rep's email (via connected account) | P0 |
| **Manual email steps** | Auto-draft email, rep reviews and sends | P1 |
| **Task steps** | Auto-create tasks: "Call this contact", "Connect on LinkedIn" | P0 |
| **Delay steps** | Configurable waits: "Wait 3 business days" (respects business hours + timezone) | P0 |
| **Branching logic** | If email opened → path A; if not → path B; if replied → exit | P1 |
| **A/B testing** | Test different email variants within a sequence | P2 |
| **Contact enrollment** | Manually enroll contacts or auto-enroll via list/workflow | P0 |
| **Bulk enrollment** | Enroll multiple contacts at once with staggered send times | P0 |
| **Unenrollment triggers** | Auto-exit: reply received, meeting booked, deal stage change, manual | P0 |
| **Sequence analytics** | Open rates, reply rates, meeting rates, bounce rates per step and overall | P0 |
| **Sender rotation** | Distribute sends across team members for deliverability | P2 |
| **Throttling** | Max sends per day/hour per mailbox to protect deliverability | P0 |
| **Template library** | Shared templates with performance data | P1 |
| **Snippet library** | Reusable text blocks for quick email composition | P1 |

### 3.3 Lead Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Lead scoring** | Point-based scoring: demographic (title, company size) + behavioral (email opens, page views, form fills) | P0 |
| **Score thresholds** | Auto-transition lifecycle stage when score crosses threshold (e.g., 80+ → MQL) | P0 |
| **Score decay** | Points decrease over time without activity | P1 |
| **Multiple score models** | Different models for different ICPs or product lines | P2 |
| **Lead routing** | Rules-based assignment: round-robin, territory (by geography/industry/size), load-balanced | P0 |
| **Lead routing rules** | If company size > 500 → Enterprise team; if industry = Healthcare → Vertical team | P1 |
| **Speed-to-lead tracking** | Time from lead creation to first contact attempt | P1 |
| **Lead qualification forms** | Structured qualification fields (BANT, MEDDIC, SPICED) | P1 |
| **Handoff workflows** | Automated notifications and task creation when MQL → SQL transition occurs | P1 |

### 3.4 Forecasting

Inspired by Salesforce Forecasting, Clari, and HubSpot.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Forecast categories** | Pipeline, Best Case, Commit, Closed Won — configurable per org | P1 |
| **Rep forecasts** | Reps submit their forecast (override of weighted pipeline) | P1 |
| **Manager rollup** | Managers see team forecast with ability to adjust | P1 |
| **Forecast vs. quota** | Track attainment: forecast / quota with gap analysis | P1 |
| **Historical comparison** | This quarter vs. same time last quarter | P2 |
| **Forecast snapshots** | Weekly snapshots to track how forecast changes over time | P2 |
| **AI forecast** | ML-based prediction using historical win rates, deal velocity, activity data | P2 |
| **Deal inspection** | Flag at-risk deals: no recent activity, pushed close date, below-average engagement | P1 |

### 3.5 Quoting & Proposals

| Feature | Description | Priority |
|---------|-------------|----------|
| **Quote builder** | Select products/services, set quantities, apply discounts | P1 |
| **Quote templates** | Branded, configurable quote document templates | P1 |
| **Quote approval workflows** | Discounts above X% require manager approval | P2 |
| **E-signatures** | Built-in or integrated (DocuSign, HelloSign) electronic signatures | P2 |
| **Quote-to-deal sync** | Accepted quote auto-updates deal amount and stage | P1 |
| **Quote versioning** | Track versions with change history | P1 |
| **Quote expiration** | Auto-expire after configurable period with reminders | P1 |
| **PDF generation** | Auto-generate professional PDF quotes | P1 |

### 3.6 Sales Tools

| Feature | Description | Priority |
|---------|-------------|----------|
| **Email integration** | Connect Gmail / Outlook — log sent/received emails to CRM automatically | P0 |
| **Calendar integration** | Sync Google/Outlook calendar — log meetings, show availability | P0 |
| **Meeting scheduler** | Shareable booking links (like Calendly) — round-robin, group meetings | P1 |
| **Email templates** | Reusable templates with merge fields and performance tracking | P0 |
| **Calling** | Click-to-call with VoIP integration (Twilio), call recording, outcome logging | P2 |
| **Document tracking** | Share documents with tracking: who viewed, time spent per page | P2 |
| **Sales playbooks** | Guided selling: scripts, objection handling, competitor battle cards per deal stage | P2 |
| **Notifications** | Real-time alerts: "Your contact just opened the proposal", "Deal stage changed" | P0 |

### 3.7 Team Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Sales teams** | Organize reps into teams with team leads | P0 |
| **Territories** | Define territories by geography, industry, company size, or custom rules | P1 |
| **Quotas** | Set monthly/quarterly quotas per rep and team | P1 |
| **Leaderboard** | Gamified view: deals closed, revenue, activities logged | P2 |
| **Activity targets** | Set activity minimums: 50 calls/week, 30 emails/day | P1 |
| **Rep performance dashboard** | Per-rep metrics: pipeline, conversion rates, activity, quota attainment | P1 |

---

## Data Model (Sales-specific, extends CRM Core)

```
┌─────────────────┐
│    Sequence      │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ status           │  (draft, active, paused, archived)
│ created_by       │
│ settings         │  (JSONB: send window, timezone, throttle limits)
│ stats_cache      │  (JSONB: cached aggregate stats)
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│  SequenceStep    │
│                  │
│ id               │
│ sequence_id      │
│ position         │
│ type             │  (email, manual_email, task, delay, branch)
│ delay_days       │
│ delay_hours      │
│ config           │  (JSONB: template, task details, branch conditions)
└─────────────────┘

┌─────────────────┐
│ SequenceEnrollment│
│                  │
│ id               │
│ sequence_id      │
│ contact_id       │
│ enrolled_by      │
│ current_step     │
│ status           │  (active, completed, replied, bounced, opted_out, manual_exit)
│ enrolled_at      │
│ completed_at     │
│ exit_reason      │
└─────────────────┘

┌─────────────────┐
│SequenceStepExec  │
│                  │
│ id               │
│ enrollment_id    │
│ step_id          │
│ executed_at      │
│ result           │  (sent, opened, clicked, replied, bounced, skipped)
│ metadata         │  (JSONB: email message ID, open/click timestamps)
└─────────────────┘

┌─────────────────┐        ┌─────────────────┐
│   LeadScore      │        │ LeadScoreRule    │
│                  │        │                  │
│ id               │        │ id               │
│ contact_id       │  UNIQUE│ model_id         │
│ model_id         │        │ type             │ (demographic, behavioral)
│ score            │        │ attribute        │ (e.g., "job_title", "email_opened")
│ last_calculated  │        │ condition        │ (JSONB: operator, value)
│ score_breakdown  │ (JSONB)│ points           │
└─────────────────┘        │ decay_per_day    │
                            └─────────────────┘

┌─────────────────┐
│ LeadScoreModel   │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ mql_threshold    │
│ sql_threshold    │
│ is_default       │
└─────────────────┘

┌─────────────────┐        ┌─────────────────┐
│   Forecast       │        │  ForecastEntry   │
│                  │        │                  │
│ id               │        │ id               │
│ tenant_id        │        │ forecast_id      │
│ period           │        │ user_id          │ (rep)
│ period_start     │        │ category         │ (pipeline, best_case, commit, closed)
│ period_end       │        │ amount           │
│ created_at       │        │ submitted_at     │
└─────────────────┘        │ manager_override │
                            └─────────────────┘

┌─────────────────┐
│     Quote        │
│                  │
│ id               │
│ tenant_id        │
│ deal_id          │
│ contact_id       │
│ version          │
│ status           │ (draft, sent, viewed, accepted, declined, expired)
│ subtotal         │
│ discount_total   │
│ tax_total        │
│ total            │
│ valid_until      │
│ template_id      │
│ sent_at          │
│ accepted_at      │
│ signature_data   │ (JSONB)
│ pdf_url          │
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│   QuoteLineItem  │
│                  │
│ id               │
│ quote_id         │
│ product_id       │ → Commerce.Product
│ name             │
│ description      │
│ quantity         │
│ unit_price       │
│ discount_pct     │
│ total            │
│ position         │
└─────────────────┘

┌─────────────────┐
│ RoutingRule      │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ priority         │ (order of evaluation)
│ conditions       │ (JSONB: field-based matching)
│ action           │ (assign_user, assign_team, round_robin_pool)
│ target_id        │ (user/team ID)
└─────────────────┘

┌─────────────────┐
│ Territory        │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ rules            │ (JSONB: geo, industry, size criteria)
│ assigned_users   │ (user IDs)
│ assigned_team    │
└─────────────────┘

┌─────────────────┐
│   Quota          │
│                  │
│ id               │
│ tenant_id        │
│ user_id          │
│ period           │ (monthly, quarterly)
│ period_start     │
│ amount           │
└─────────────────┘
```

---

## Key Workflows

### Sequence Execution Flow

```
1. Contact enrolled in sequence (manual or automation trigger)
2. Scheduler picks up enrollment, evaluates first step
3. For each step:
   a. DELAY step: Schedule next check after delay period (respecting business hours)
   b. EMAIL step:
      - Render template with contact merge fields
      - Check throttle limits (per mailbox, per day)
      - Send via connected email account (Gmail API / SMTP)
      - Track: log send, register open/click tracking
   c. MANUAL_EMAIL step:
      - Create draft in rep's inbox
      - Create task: "Review and send email to {contact}"
      - Wait for send or skip
   d. TASK step:
      - Create task for the rep
      - Wait for completion or auto-advance after timeout
   e. BRANCH step:
      - Evaluate condition (e.g., "email opened?")
      - Route to appropriate next step
4. Check exit conditions after each step:
   - Reply received → exit with status "replied"
   - Meeting booked → exit with status "meeting_booked"
   - Contact opted out → exit with status "opted_out"
   - Deal stage changed → exit (configurable)
5. After last step: mark enrollment complete
6. Update sequence stats
```

### Lead Scoring Flow

```
1. Event received (contact.created, email.opened, page.viewed, form.submitted, etc.)
2. Load active score models for tenant
3. For each model:
   a. Evaluate all rules against the contact's current state
   b. Sum demographic points (static: job title, company size, etc.)
   c. Sum behavioral points (time-decayed: opens, clicks, page views)
   d. Apply decay to historical behavioral points
   e. Calculate new total score
4. Check threshold crossings:
   a. Score crossed MQL threshold → emit lead.qualified_mql
   b. Score crossed SQL threshold → emit lead.qualified_sql
5. Update LeadScore record
6. If lifecycle transition triggered → update contact lifecycle stage
```

---

## Events Emitted

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `sequence.enrollment.created` | Contact enrolled | Sequence scheduler |
| `sequence.step.executed` | Step completed | Data (analytics) |
| `sequence.enrollment.completed` | Sequence finished | Data, CRM (activity log) |
| `lead.score_changed` | Score recalculated | CRM (property update) |
| `lead.qualified_mql` | Score crosses MQL threshold | Marketing, Notifications |
| `lead.qualified_sql` | Score crosses SQL threshold | Sales (routing), Notifications |
| `quote.sent` | Quote emailed | Data, Notifications |
| `quote.accepted` | E-signature completed | Commerce (invoice), Deal (stage update) |
| `forecast.submitted` | Rep submits forecast | Data (reporting) |

---

## AI/ML Opportunities

1. **Predictive lead scoring** — Train on historical closed-won/lost deals to score leads by likelihood to convert, replacing manual rule-based scoring
2. **Deal risk assessment** — Flag deals likely to slip based on activity patterns, email sentiment, stage duration vs. historical norms
3. **Optimal send time** — ML model predicts best time to send emails per contact based on past open behavior
4. **Email subject line suggestions** — Generate subject lines based on best-performing historical emails to similar personas
5. **Guided selling** — AI suggests next best action per deal based on what top performers do at each stage
6. **Conversation intelligence** — Analyze call transcripts for keywords, competitor mentions, objection patterns (when calling feature is built)
7. **Forecast accuracy** — ML model that adjusts rep forecasts based on historical over/under-forecasting patterns

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| Sequence execution at scale (100K+ enrollments) | BullMQ with dedicated worker pool; partitioned by tenant for fairness |
| Lead score recalculation | Event-driven (not batch); score only recalculated when relevant event occurs |
| Pipeline board with 1000+ deals | Virtual scrolling; only render visible cards; paginated API |
| Email send throttling | Token bucket rate limiter per mailbox in Redis |
| Forecast rollup across large teams | Materialized view refreshed on forecast submission |
