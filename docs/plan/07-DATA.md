# 07 — Data Module

## Overview

The Data module is the analytics and intelligence layer of the platform. It provides reporting, dashboards, custom analytics, a data warehouse layer, and AI/ML features. The goal is to replace standalone tools like Looker, Mixpanel, Amplitude, and HubSpot's reporting with a unified analytics experience that draws from all platform modules.

**Key personas:** RevOps, marketing ops, sales managers, executives, data analysts, customer success leads.

**Benchmark tools:** HubSpot Reporting, Salesforce Reports & Dashboards, Looker, Mixpanel, Amplitude, Metabase, Segment.

---

## Feature Inventory

### 7.1 Dashboards

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dashboard builder** | Drag-and-drop dashboard canvas with resizable widgets | P0 |
| **Widget types** | Number/KPI, line chart, bar chart, pie/donut, funnel, table, list, goal tracker, leaderboard, heatmap | P0 |
| **Pre-built dashboards** | Out-of-the-box: Sales Overview, Marketing Performance, Service Metrics, Revenue, Pipeline Health | P0 |
| **Custom dashboards** | Create from scratch with any available metrics | P0 |
| **Dashboard sharing** | Share with team, role, or org; public view link with optional password | P0 |
| **Dashboard permissions** | View/edit access control | P0 |
| **Auto-refresh** | Configurable refresh interval (1min to 1 day) | P1 |
| **Date range picker** | Global date filter applied to all widgets; presets (today, this week, this month, this quarter, YTD, custom) | P0 |
| **Comparison periods** | Compare current vs. previous period (MoM, QoQ, YoY) | P0 |
| **Dashboard templates** | Clone dashboards as templates for new teams | P1 |
| **TV mode** | Full-screen auto-rotating view for office monitors | P2 |
| **Scheduled reports** | Email dashboard snapshot on schedule (daily, weekly, monthly) | P1 |
| **PDF export** | Export dashboard as PDF | P1 |

### 7.2 Reports

| Feature | Description | Priority |
|---------|-------------|----------|
| **Report builder** | Step-by-step: choose data source → select fields → add filters → choose visualization | P0 |
| **Data sources** | Contacts, companies, deals, activities, tickets, emails, page views, forms, products, invoices | P0 |
| **Cross-object reports** | Join across objects: "Deals by Contact's Lead Source" or "Revenue by Company Industry" | P0 |
| **Aggregations** | Count, sum, average, min, max, median, percentile, count distinct | P0 |
| **Grouping** | Group by any field, date intervals (day/week/month/quarter/year), custom ranges | P0 |
| **Filters** | All filter operators: equals, contains, greater than, is empty, date ranges, relative dates | P0 |
| **Visualizations** | Table, bar, line, area, pie, donut, funnel, scatter, cohort | P0 |
| **Pivot tables** | Row + column grouping for matrix views | P1 |
| **Calculated fields** | Create computed fields in reports: ratios, differences, date diffs | P1 |
| **Report library** | Browse, search, and favorite saved reports | P0 |
| **Report scheduling** | Email reports on schedule to specified recipients | P1 |
| **Export** | CSV, Excel, PDF export | P0 |
| **Drill-down** | Click a chart segment to see underlying records | P0 |
| **Goal lines** | Add target/goal lines on charts | P1 |
| **Annotations** | Add annotations to charts (e.g., "Product launch" marker on timeline) | P2 |

### 7.3 Pre-built Analytics

#### Sales Analytics

| Metric/Report | Description |
|---------------|-------------|
| Pipeline value by stage | Current pipeline broken down by stage |
| Pipeline velocity | Average time in each stage; total cycle length |
| Win rate | Deals won / (won + lost) over time |
| Deal size distribution | Histogram of deal amounts |
| Sales activity summary | Calls, emails, meetings per rep per period |
| Quota attainment | Actual vs. quota per rep and team |
| Forecast accuracy | Historical forecast vs. actual |
| Lead source ROI | Revenue by original lead source |
| Stage conversion rates | % progressing from each stage to next |
| Revenue waterfall | New, expansion, churn, contraction, net revenue |

#### Marketing Analytics

| Metric/Report | Description |
|---------------|-------------|
| Email performance | Sends, opens, clicks, bounces, unsubscribes over time |
| Campaign ROI | Spend vs. influenced revenue per campaign |
| Form conversion rates | Views to submissions per form |
| Landing page performance | Traffic, bounce rate, conversions per page |
| Lead generation | New leads by source over time |
| Lead-to-customer rate | Lifecycle stage conversion funnel |
| Channel attribution | First-touch, last-touch, multi-touch attributed revenue |
| Website traffic | Page views, unique visitors, sessions, top pages |
| Blog performance | Views, reading time, CTA conversions per post |
| Marketing-sourced pipeline | Pipeline $ from marketing-generated leads |

#### Service Analytics

| Metric/Report | Description |
|---------------|-------------|
| Ticket volume | New tickets over time by channel, category |
| Resolution time | Average time to resolve by priority, category, agent |
| First response time | Time to first agent response |
| SLA compliance | % within SLA for response and resolution |
| CSAT scores | Satisfaction trends by agent, category, period |
| NPS trends | NPS score over time with detractor/passive/promoter breakdown |
| Agent performance | Tickets resolved, avg handling time, CSAT per agent |
| Knowledge base effectiveness | Article views, helpfulness ratings, search gaps |
| Ticket backlog | Open tickets aging analysis |
| Channel distribution | Tickets by channel over time |

#### Commerce Analytics (detail in 08-COMMERCE.md)

| Metric/Report | Description |
|---------------|-------------|
| Revenue | Total, recurring, one-time revenue over time |
| MRR/ARR | Monthly/Annual recurring revenue trends |
| Churn rate | Customer churn and revenue churn |
| LTV | Customer lifetime value by segment |
| Average order value | Mean transaction amount |

### 7.4 Event Tracking & CDP

Inspired by Segment, Mixpanel, and Amplitude.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Event stream** | Unified stream of all platform events: behavioral, transactional, system | P0 |
| **Custom events** | Track custom events via JavaScript SDK or API | P1 |
| **Event properties** | Rich metadata on each event (key-value pairs) | P0 |
| **Identity resolution** | Link anonymous sessions to known contacts; merge identities | P0 |
| **Event explorer** | Browse and search the event stream; filter by type, contact, time | P1 |
| **Funnel analysis** | Define multi-step funnels; measure conversion and drop-off | P1 |
| **Cohort analysis** | Group contacts by first action date; track retention over time | P2 |
| **User journey mapping** | Visualize common paths through events/pages | P2 |
| **Event-based segments** | Create contact segments based on event history | P0 |
| **Data export** | Bulk event export for external analysis | P1 |
| **Event forwarding** | Forward events to external systems (Snowflake, BigQuery, webhooks) | P2 |

### 7.5 Data Quality & Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Data validation rules** | Define rules: "Email must be valid", "Phone must match format" | P1 |
| **Completeness scoring** | Per-record data quality score based on filled vs. required fields | P1 |
| **Duplicate management** | Bulk duplicate detection with merge suggestions | P0 |
| **Data import** | CSV import with mapping, dedup, validation preview | P0 |
| **Data export** | Scheduled exports to S3 or external warehouse | P1 |
| **Field audit** | Track which fields are unused, incomplete, or inconsistent | P2 |
| **GDPR tools** | Data subject access requests: export all data for a contact; right to erasure: delete all data | P1 |

### 7.6 AI/ML Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Predictive lead scoring** | ML model trained on closed deals to score leads | P2 |
| **Churn prediction** | Identify customers likely to churn based on behavior patterns | P2 |
| **Revenue forecasting** | Time-series forecasting of revenue based on pipeline and historical data | P2 |
| **Anomaly detection** | Alert on unusual metrics: sudden traffic spike, abnormal bounce rate, unusual deal volume | P2 |
| **Natural language queries** | "Show me deals closed this quarter by lead source" → auto-generate report | P2 |
| **Automated insights** | Weekly auto-generated insights: "Your email open rate improved 15% — here's why" | P3 |
| **Recommendations** | "Based on data, you should follow up with these 10 contacts this week" | P3 |

---

## Data Model

```
┌─────────────────────┐
│      Event           │  (unified event stream)
│                      │
│ id                   │  (UUID)
│ tenant_id            │
│ type                 │  (e.g., 'contact.created', 'email.opened', 'page.viewed', 'custom.signup')
│ category             │  (crm, sales, marketing, service, content, commerce, custom)
│ contact_id           │  (null for anonymous/system events)
│ session_id           │
│ user_id              │  (internal user who caused it, if applicable)
│ properties           │  (JSONB: event-specific data)
│ context              │  (JSONB: ip, user_agent, page_url, utm, etc.)
│ occurred_at          │
│ ingested_at          │
└──────────────────────┘
-- Partitioned by tenant_id + occurred_at (monthly)
-- Indexes: (tenant_id, type, occurred_at), (tenant_id, contact_id, occurred_at)

┌─────────────────────┐
│    Dashboard         │
│                      │
│ id                   │
│ tenant_id            │
│ name                 │
│ description          │
│ created_by           │
│ layout               │  (JSONB: widget positions and sizes)
│ default_date_range   │
│ is_system            │  (pre-built dashboards)
│ shared_with          │  (JSONB: user IDs, team IDs, or 'all')
│ created_at           │
│ updated_at           │
└───────┬──────────────┘
        │ 1:M
        ▼
┌─────────────────────┐
│   DashboardWidget    │
│                      │
│ id                   │
│ dashboard_id         │
│ title                │
│ type                 │  (kpi, line, bar, pie, funnel, table, list, goal, leaderboard)
│ report_id            │  → Report (uses report as data source)
│ config               │  (JSONB: visualization options, colors, goal value)
│ position             │  (JSONB: {x, y, w, h} on grid)
│ refresh_interval     │
└──────────────────────┘

┌─────────────────────┐
│      Report          │
│                      │
│ id                   │
│ tenant_id            │
│ name                 │
│ description          │
│ data_source          │  (contacts, deals, tickets, events, etc.)
│ joins                │  (JSONB: cross-object join config)
│ fields               │  (JSONB: selected fields + aggregations)
│ filters              │  (JSONB: filter conditions)
│ group_by             │  (JSONB: grouping config)
│ sort                 │  (JSONB)
│ visualization        │  (JSONB: chart type + options)
│ calculated_fields    │  (JSONB: computed field definitions)
│ created_by           │
│ is_system            │
│ last_run_at          │
│ cache_key            │
│ cache_ttl            │
│ created_at           │
│ updated_at           │
└──────────────────────┘

┌─────────────────────┐
│  ScheduledReport     │
│                      │
│ id                   │
│ report_id            │  or dashboard_id
│ type                 │  (report, dashboard)
│ schedule             │  (JSONB: cron expression or preset)
│ recipients           │  (text[]: email addresses)
│ format               │  (csv, pdf, excel)
│ last_sent_at         │
│ next_send_at         │
│ created_by           │
└──────────────────────┘

┌─────────────────────┐
│   FunnelDefinition   │
│                      │
│ id                   │
│ tenant_id            │
│ name                 │
│ steps                │  (JSONB: [{event_type, conditions, window}])
│ conversion_window    │  (how long between first and last step)
│ created_by           │
└──────────────────────┘

┌─────────────────────┐
│ AttributionModel     │
│                      │
│ id                   │
│ tenant_id            │
│ name                 │
│ type                 │  (first_touch, last_touch, linear, time_decay, u_shaped, custom)
│ config               │  (JSONB: weights, lookback window)
│ is_default           │
└──────────────────────┘

┌─────────────────────┐
│ AttributionRecord    │
│                      │
│ id                   │
│ tenant_id            │
│ deal_id              │
│ model_id             │
│ touchpoints          │  (JSONB: [{type, timestamp, channel, campaign_id, credit_pct}])
│ total_revenue        │
│ calculated_at        │
└──────────────────────┘
```

---

## Key Workflows

### Report Execution Flow

```
1. User configures report (via builder or loads saved report)
2. Report engine:
   a. Parse report config into query plan
   b. Check cache: if cache_key exists and TTL not expired → return cached
   c. Build SQL query:
      - FROM clause from data_source + joins
      - WHERE clause from filters (including tenant_id!)
      - GROUP BY from grouping config
      - SELECT with aggregations and calculated fields
      - ORDER BY + LIMIT/OFFSET
   d. Execute on read replica (for complex queries)
   e. Transform results for visualization
   f. Cache results with TTL
3. Return formatted data to frontend
4. Frontend renders chosen visualization
5. For drill-down: click segment → load underlying records with filters applied
```

### Attribution Calculation Flow

```
1. Deal marked as won
2. Attribution service triggered
3. For the deal's primary contact(s):
   a. Collect all touchpoints: form submissions, page views, email clicks, ad clicks, direct visits
   b. Order chronologically
   c. Apply each attribution model:
      - First touch: 100% to first touchpoint
      - Last touch: 100% to last touchpoint before deal creation
      - Linear: equal split across all touchpoints
      - U-shaped: 40% first, 40% last, 20% distributed across middle
      - Time decay: exponentially more credit to recent touchpoints
4. Store AttributionRecords
5. Update campaign ROI calculations
```

---

## Events Consumed (from all modules)

The Data module is the primary **consumer** of events. It listens to everything:

| Source Module | Events |
|---------------|--------|
| CRM | contact.*, company.*, deal.*, activity.* |
| Sales | sequence.*, lead.score_changed, quote.*, forecast.* |
| Marketing | email.*, form.*, workflow.*, page.*, campaign.* |
| Service | ticket.*, chat.*, survey.*, kb.article.* |
| Content | content.*, asset.* |
| Commerce | order.*, invoice.*, subscription.*, payment.* |
| Integrations | integration.sync.*, webhook.* |

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| Event volume (millions/day) | Partitioned events table by tenant + month; time-based retention with archival to S3/Glacier |
| Complex report queries | Read replicas for analytics; query timeout + cancellation; result caching |
| Dashboard with many widgets | Parallel widget data fetching; staggered loading; progressive rendering |
| Attribution across many touchpoints | Batch calculation (not real-time); nightly job for historical recalculation |
| Real-time dashboards | Redis-based metric counters updated on event; dashboard reads from counter cache |
| Data export for large datasets | Async export job; stream to S3; download link via email |
| Natural language queries | LLM + schema metadata → SQL generation → execution → visualization |
