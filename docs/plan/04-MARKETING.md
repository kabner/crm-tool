# 04 — Marketing Module

## Overview

The Marketing module handles everything from lead generation to nurturing to attribution. It covers email marketing, campaign management, marketing automation, forms, landing pages, and ad management. The goal is to replace tools like Mailchimp, ActiveCampaign, Klaviyo, and HubSpot Marketing Hub with a deeply integrated solution that shares data natively with Sales and CRM.

**Key personas:** Marketing managers, email marketers, demand gen, growth marketers, marketing ops, content marketers.

**Benchmark tools:** HubSpot Marketing Hub, ActiveCampaign, Klaviyo, Mailchimp, Marketo, Pardot, Customer.io, ConvertKit.

---

## Feature Inventory

### 4.1 Email Marketing

| Feature | Description | Priority |
|---------|-------------|----------|
| **Email builder** | Drag-and-drop visual editor with responsive preview (desktop/mobile) | P0 |
| **HTML editor** | Raw HTML editing for advanced users | P0 |
| **Template library** | Pre-built templates for newsletters, promotions, announcements, drip campaigns | P0 |
| **Custom templates** | Save and reuse custom designs; brand-locked sections | P0 |
| **Personalization tokens** | Merge fields: `{{first_name}}`, `{{company.name}}`, custom property values | P0 |
| **Dynamic content** | Show/hide blocks based on contact properties or segment membership | P1 |
| **Smart content** | Personalize entire sections based on lifecycle stage, geography, or persona | P2 |
| **A/B testing** | Test subject lines, sender name, content, send time; auto-send winner | P0 |
| **Send scheduling** | Schedule for specific time, or use AI-optimized send time per contact | P0 |
| **Send throttling** | Warm up new sending domains; control sends/hour | P0 |
| **Email health dashboard** | Deliverability metrics: bounce rate, spam rate, domain reputation | P0 |
| **List hygiene** | Auto-suppress hard bounces; re-engagement campaigns for inactive; sunset policies | P1 |
| **Transactional email** | API-triggered emails (password reset, order confirmation) alongside marketing | P1 |
| **RSS-to-email** | Auto-generate emails from blog RSS feed | P2 |
| **Email preview** | Preview rendering across major email clients (Litmus-style, or integration) | P2 |

#### Email Infrastructure

| Component | Description |
|-----------|-------------|
| **Sending** | Amazon SES (primary) with SendGrid/Postmark fallback; DKIM/SPF/DMARC configured per tenant |
| **Tracking** | Open tracking (pixel), click tracking (link wrapping through our domain) |
| **Bounce handling** | SES/SNS webhook for bounce/complaint processing; auto-suppress |
| **Unsubscribe** | One-click unsubscribe header (RFC 8058); unsubscribe page; preference center |
| **Deliverability** | Dedicated IPs for high-volume tenants; IP warmup schedule; feedback loops |
| **Compliance** | CAN-SPAM footer auto-injection; GDPR consent tracking; physical address requirement |

### 4.2 Marketing Automation

Inspired by ActiveCampaign and Klaviyo's visual workflow builders.

| Feature | Description | Priority |
|---------|-------------|----------|
| **Visual workflow builder** | Node-based drag-and-drop canvas for building automation flows | P0 |
| **Enrollment triggers** | Form submission, list membership, lifecycle change, property change, page view, event, date-based, manual | P0 |
| **Actions** | Send email, add/remove from list, set property, create task, notify user, enroll in sequence, send webhook, wait, branch | P0 |
| **If/then branching** | Conditional paths based on contact properties, email engagement, list membership | P0 |
| **A/B split** | Split workflow path for testing different approaches | P1 |
| **Goal nodes** | Define success criteria; contacts exit when goal met | P1 |
| **Delay nodes** | Wait X days/hours; wait until specific date; wait until day of week | P0 |
| **Frequency caps** | Prevent contacts from receiving too many emails in a period | P1 |
| **Workflow analytics** | Funnel view: how many contacts at each step, conversion rates, drop-off points | P0 |
| **Workflow templates** | Pre-built automations: welcome series, re-engagement, onboarding, winback, birthday | P1 |
| **Active/paused/draft** | Lifecycle states with safe activation (validate before publish) | P0 |
| **Version history** | Track changes to published workflows; rollback | P1 |
| **Nested workflows** | Trigger one workflow from another (composability) | P2 |
| **Suppression rules** | Global suppression: never email contacts in "Do Not Contact" status | P0 |

### 4.3 Forms

| Feature | Description | Priority |
|---------|-------------|----------|
| **Form builder** | Drag-and-drop form builder with field mapping to CRM properties | P0 |
| **Field types** | Text, email, phone, dropdown, checkbox, radio, date, file upload, hidden, dependent | P0 |
| **Progressive profiling** | Show different fields on repeat visits (don't ask what you already know) | P2 |
| **Smart fields** | Auto-hide fields if data already known; show new qualifying questions | P2 |
| **Conditional logic** | Show/hide fields based on previous answers | P1 |
| **Multi-step forms** | Break long forms into steps with progress indicator | P1 |
| **Embed options** | Inline embed, popup, slide-in, standalone page | P0 |
| **Styling** | Customizable CSS; inherit from site theme; or use CRM design system | P0 |
| **Spam protection** | reCAPTCHA, honeypot fields, rate limiting | P0 |
| **Submission handling** | Create/update contact, add to list, trigger workflow, send notification, redirect | P0 |
| **Pre-fill** | Pre-populate known fields from CRM data (for known visitors) | P1 |
| **File uploads** | Allow document/image uploads stored in S3 | P1 |
| **Form analytics** | Views, submissions, conversion rate, field drop-off analysis | P0 |
| **GDPR consent** | Consent checkboxes with audit trail of consent granted | P0 |

### 4.4 Landing Pages

| Feature | Description | Priority |
|---------|-------------|----------|
| **Page builder** | Visual drag-and-drop landing page builder | P1 |
| **Templates** | Pre-built landing page templates for common use cases | P1 |
| **Custom domains** | Host landing pages on custom domains with SSL | P1 |
| **A/B testing** | Test page variants with traffic splitting | P2 |
| **Dynamic text replacement** | Swap headlines/text based on UTM parameters or ad source | P2 |
| **Responsive design** | Auto-responsive with mobile preview | P1 |
| **SEO settings** | Meta title, description, OG tags, canonical URL | P1 |
| **Conversion tracking** | Track form submissions as page conversions | P1 |
| **Integration** | Embed CRM forms; auto-track page views in contact timeline | P1 |

### 4.5 Campaign Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Campaigns** | Group related marketing activities: emails, ads, landing pages, content | P0 |
| **Campaign types** | Email, content, event, paid, social, ABM, product launch | P0 |
| **Campaign attribution** | First-touch, last-touch, multi-touch attribution models | P1 |
| **UTM tracking** | Auto-generate and track UTM parameters; map to campaigns | P0 |
| **Campaign ROI** | Track spend vs. influenced revenue (contacts on campaign → deals won) | P1 |
| **Campaign dashboard** | Overview: reach, engagement, leads generated, deals influenced, revenue attributed | P0 |
| **Campaign timeline** | Visualize campaign activities over time | P1 |

### 4.6 Ad Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Ad account connection** | Connect Google Ads, Facebook/Meta Ads, LinkedIn Ads | P2 |
| **Lead sync** | Sync CRM lists as custom audiences for ad targeting | P2 |
| **Lead form sync** | Auto-import leads from ad platform lead forms into CRM | P2 |
| **Ad performance** | Pull ad metrics into CRM for unified reporting | P2 |
| **Ad spend tracking** | Track spend per campaign for ROI calculation | P2 |
| **Lookalike audiences** | Export customer segments for lookalike audience creation | P2 |

### 4.7 Social Media (Basic)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Social scheduling** | Schedule posts to LinkedIn, Twitter/X, Facebook | P2 |
| **Social inbox** | Monitor mentions and messages (basic) | P3 |
| **Social tracking** | Track social interactions on contact timeline | P2 |

### 4.8 Website Tracking

| Feature | Description | Priority |
|---------|-------------|----------|
| **Tracking script** | JavaScript snippet for website visitor tracking | P0 |
| **Page view tracking** | Record page views tied to known contacts (cookie-based) | P0 |
| **Anonymous visitor tracking** | Track anonymous sessions; retroactively attach to contact on form fill | P0 |
| **Event tracking** | Custom JavaScript events (button clicks, video plays, scroll depth) | P1 |
| **UTM capture** | Auto-capture UTM parameters on first visit; store on contact | P0 |
| **Referral source** | Capture and categorize traffic sources | P0 |
| **Session replay** | (Integration) Connect with FullStory/Hotjar for session replay | P3 |

---

## Data Model

```
┌─────────────────┐
│    Campaign      │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ type             │  (email, content, paid, event, abm)
│ status           │  (draft, active, completed, archived)
│ start_date       │
│ end_date         │
│ budget           │
│ actual_spend     │
│ owner_id         │
│ settings         │  (JSONB)
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│ CampaignAsset    │
│                  │
│ id               │
│ campaign_id      │
│ asset_type       │  (email, landing_page, form, ad, blog_post)
│ asset_id         │  (polymorphic reference)
└─────────────────┘

┌─────────────────┐
│  MarketingEmail  │
│                  │
│ id               │
│ tenant_id        │
│ name             │  (internal name)
│ subject          │
│ preview_text     │
│ from_name        │
│ from_email       │
│ reply_to         │
│ content_html     │
│ content_json     │  (JSONB: editor state for re-editing)
│ template_id      │
│ status           │  (draft, scheduled, sending, sent, archived)
│ send_type        │  (broadcast, automated, ab_test)
│ scheduled_at     │
│ sent_at          │
│ ab_test_config   │  (JSONB: variants, win criteria, sample size)
│ stats_cache      │  (JSONB: sent, delivered, opened, clicked, bounced, unsubscribed)
│ campaign_id      │
└─────────────────┘

┌─────────────────┐
│   EmailSend      │
│                  │
│ id               │
│ tenant_id        │
│ email_id         │  → MarketingEmail
│ contact_id       │  → Contact
│ variant          │  (for A/B: 'A', 'B', 'winner')
│ status           │  (queued, sent, delivered, bounced, complained)
│ sent_at          │
│ delivered_at     │
│ opened_at        │  (first open)
│ open_count       │
│ clicked_at       │  (first click)
│ click_count      │
│ unsubscribed_at  │
│ bounced_at       │
│ bounce_type      │  (hard, soft)
│ message_id       │  (SES message ID)
└─────────────────┘

┌─────────────────┐
│  EmailClick      │
│                  │
│ id               │
│ email_send_id    │
│ url              │
│ clicked_at       │
│ user_agent       │
│ ip_address       │
└─────────────────┘

┌─────────────────┐
│    Workflow      │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ description      │
│ status           │  (draft, active, paused, archived)
│ trigger_config   │  (JSONB: trigger type, conditions)
│ version          │
│ created_by       │
│ published_at     │
│ stats_cache      │  (JSONB)
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│  WorkflowNode    │
│                  │
│ id               │
│ workflow_id      │
│ type             │  (trigger, action, condition, delay, ab_split, goal)
│ config           │  (JSONB: action-specific configuration)
│ position_x       │  (canvas position)
│ position_y       │
└─────────────────┘

┌─────────────────┐
│  WorkflowEdge    │
│                  │
│ id               │
│ workflow_id      │
│ from_node_id     │
│ to_node_id       │
│ condition_branch │  (null, 'yes', 'no', 'a', 'b')
└─────────────────┘

┌─────────────────────┐
│ WorkflowEnrollment   │
│                      │
│ id                   │
│ workflow_id          │
│ contact_id           │
│ current_node_id      │
│ status               │  (active, completed, goal_met, error, manual_exit)
│ enrolled_at          │
│ completed_at         │
│ next_action_at       │  (for delay nodes: when to resume)
└─────────────────────┘

┌─────────────────┐
│     Form         │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ status           │  (draft, published, archived)
│ fields           │  (JSONB: ordered array of field definitions)
│ settings         │  (JSONB: redirect URL, notification, captcha, styling)
│ embed_code       │
│ submission_count │
│ campaign_id      │
└─────────────────┘

┌─────────────────┐
│ FormSubmission   │
│                  │
│ id               │
│ form_id          │
│ contact_id       │  (matched or created)
│ data             │  (JSONB: submitted field values)
│ page_url         │
│ referrer         │
│ utm_params       │  (JSONB)
│ ip_address       │
│ submitted_at     │
│ consent_given    │
└─────────────────┘

┌─────────────────┐
│  LandingPage     │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ slug             │
│ domain           │
│ content_json     │  (JSONB: page builder state)
│ content_html     │  (rendered HTML)
│ status           │  (draft, published, archived)
│ seo_config       │  (JSONB: title, description, OG tags)
│ ab_variant       │
│ campaign_id      │
│ published_at     │
│ stats_cache      │  (JSONB: views, submissions, conversion_rate)
└─────────────────┘

┌─────────────────┐
│  PageView        │
│                  │
│ id               │
│ tenant_id        │
│ contact_id       │  (null if anonymous)
│ session_id       │
│ page_url         │
│ page_title       │
│ referrer         │
│ utm_source       │
│ utm_medium       │
│ utm_campaign     │
│ utm_content      │
│ utm_term         │
│ duration_ms      │
│ viewed_at        │
└─────────────────┘

┌─────────────────┐
│ EmailTemplate    │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ category         │
│ content_json     │  (JSONB: editor state)
│ content_html     │
│ thumbnail_url    │
│ is_system        │  (built-in templates)
└─────────────────┘

┌────────────────────┐
│ UnsubscribeRecord  │
│                    │
│ id                 │
│ tenant_id          │
│ contact_id         │
│ email_id           │ (which email triggered it)
│ reason             │
│ unsubscribed_at    │
│ scope              │ (all, channel, topic)
│ topic_id           │ (for topic-level unsub)
└────────────────────┘

┌─────────────────┐
│  EmailTopic      │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ description      │
│ is_default       │
└─────────────────┘
```

---

## Key Workflows

### Email Broadcast Send Flow

```
1. Marketer creates email in builder
2. Selects recipient list(s) / segment(s)
3. Optionally configures A/B test (up to 5 variants)
4. Schedules send (or sends immediately)
5. Pre-send validation:
   a. Spam score check (SpamAssassin-style)
   b. Link validation (no broken links)
   c. Unsubscribe link present
   d. Physical address present
   e. Personalization tokens valid
   f. List has contacts with valid emails
6. At send time:
   a. Resolve recipients: expand smart lists, remove unsubscribed/bounced/suppressed
   b. For A/B: split recipients into test groups + holdback for winner
   c. Queue email sends in BullMQ (batched, throttled)
   d. Worker renders each email (personalization) and sends via SES
   e. Track message IDs for delivery/bounce/open/click tracking
7. SES webhooks update EmailSend records asynchronously
8. After test period (A/B): determine winner, send to remaining recipients
9. Update stats cache; generate send report
```

### Marketing Automation Workflow Execution

```
1. Trigger fires (e.g., form submission, list add, property change)
2. Check if contact is already enrolled (prevent duplicate enrollment unless allowed)
3. Check suppression rules (do-not-contact, frequency caps)
4. Create WorkflowEnrollment, set current_node to trigger node
5. Process nodes sequentially:
   a. ACTION (send email): Queue email send, advance to next node
   b. ACTION (set property): Update contact property, advance
   c. CONDITION (if/then): Evaluate condition, follow matching branch
   d. DELAY (wait): Set next_action_at, scheduler picks up later
   e. AB_SPLIT: Randomly assign branch, record assignment
   f. GOAL: Check if goal condition met; if yes, complete enrollment
6. Scheduler process: periodically queries enrollments where next_action_at <= now
7. On workflow pause: freeze all enrollments
8. On workflow edit: new enrollments use new version; existing continue on old version
```

---

## Events Emitted

| Event | Consumers |
|-------|-----------|
| `email.sent` | Data (analytics), CRM (timeline) |
| `email.delivered` | Data, Email health tracking |
| `email.opened` | Sales (lead scoring), CRM (timeline), Data |
| `email.clicked` | Sales (lead scoring), CRM (timeline), Data |
| `email.bounced` | CRM (contact status), Email health |
| `email.unsubscribed` | CRM (preference update), Compliance |
| `form.submitted` | CRM (create/update contact), Sales (lead routing), Data |
| `workflow.enrollment.created` | Data |
| `workflow.enrollment.completed` | Data |
| `page.viewed` | Sales (lead scoring), CRM (timeline), Data |
| `campaign.completed` | Data (ROI reporting) |

---

## Cross-Module Dependencies

| Module | Marketing Provides | Marketing Consumes |
|--------|-------------------|-------------------|
| **CRM** | Form submissions (new contacts), engagement data, email events for timeline | Contact/list data for targeting, lifecycle stages |
| **Sales** | MQL notifications, lead scoring signals (behavioral) | Sequence status (avoid double-emailing), deal data for attribution |
| **Content** | Email/landing page content rendering | Blog posts (for RSS emails), content analytics |
| **Data** | All engagement events for reporting | Dashboard data, campaign ROI calculations |
| **Commerce** | Abandoned cart triggers, post-purchase campaigns | Purchase events, product data |
| **Integrations** | Ad platform sync data | External lead sources |

---

## AI/ML Opportunities

1. **Send time optimization** — Per-contact optimal send time based on historical open patterns
2. **Subject line scoring** — Predict open rate of subject lines before sending
3. **Content recommendations** — Suggest email content based on contact's interests and engagement history
4. **Audience suggestions** — "Contacts similar to your best customers who haven't been contacted"
5. **Churn prediction** — Identify contacts showing disengagement patterns; auto-trigger re-engagement
6. **Campaign performance prediction** — Estimate reach and engagement before launch
7. **Smart segmentation** — AI-generated segments based on behavioral clustering
8. **Email content generation** — AI-assisted email copywriting with brand voice training

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| Sending 500K emails/hour | Batched SES sends with multiple sending domains; parallel workers; queue partitioning |
| Email rendering at scale | Pre-render where possible; cache compiled templates; parallelize personalization |
| Tracking pixel/click volume | Lightweight tracking endpoint (minimal processing); batch-write to DB; Redis buffer |
| Smart list resolution | Cached membership with event-driven invalidation; async recalculation for large segments |
| Workflow execution | Scheduler with partitioned work queues; tenant-fair scheduling to prevent noisy neighbors |
| Page view tracking volume | Write to time-series-optimized table (partitioned by week); aggregate hourly for reporting |
| A/B test statistics | Pre-computed statistical significance using sequential testing (not just fixed sample) |
