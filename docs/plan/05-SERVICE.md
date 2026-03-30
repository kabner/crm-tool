# 05 — Service Module

## Overview

The Service module handles customer support and success. It provides a multi-channel ticketing system, knowledge base, live chat, SLA management, and customer satisfaction tracking. The goal is to replace Zendesk, Freshdesk, Intercom, and HubSpot Service Hub with a solution that has native access to the full customer context from CRM, Sales, and Commerce.

**Key personas:** Support agents, support managers, customer success managers, knowledge base authors.

**Benchmark tools:** Zendesk, Freshdesk, Intercom, HubSpot Service Hub, Help Scout, Front, Crisp.

---

## Feature Inventory

### 5.1 Ticketing System

| Feature | Description | Priority |
|---------|-------------|----------|
| **Shared inbox** | Unified inbox for all support channels: email, chat, form, social, phone | P0 |
| **Ticket creation** | Auto-create from inbound email, chat, form; manual creation by agents | P0 |
| **Ticket properties** | Status, priority, category, assignee, team, source, due date, custom fields | P0 |
| **Ticket statuses** | Configurable: New → Open → Pending → On Hold → Resolved → Closed | P0 |
| **Ticket priority** | Urgent, High, Normal, Low with visual indicators | P0 |
| **Ticket categories** | Configurable taxonomy: Bug Report, Feature Request, Billing, How-To, etc. | P0 |
| **Ticket tags** | Freeform tags for flexible categorization | P0 |
| **Ticket assignment** | Manual, round-robin, load-balanced, skill-based auto-assignment | P0 |
| **Ticket routing rules** | Route based on: category, customer tier, language, product, custom rules | P1 |
| **Internal notes** | Private notes visible only to agents (not sent to customer) | P0 |
| **@mentions** | Tag team members in internal notes for collaboration | P0 |
| **Collision detection** | Show when another agent is viewing/replying to the same ticket | P1 |
| **Canned responses** | Pre-written reply templates with merge fields | P0 |
| **Rich text replies** | Formatted text, images, attachments, inline screenshots | P0 |
| **Ticket splitting** | Split a ticket into multiple tickets (multi-issue reports) | P1 |
| **Ticket merging** | Merge duplicate tickets preserving all messages | P0 |
| **Linked tickets** | Link related tickets (parent/child or related) | P1 |
| **Ticket views** | Custom filtered views: "My open tickets", "Urgent unassigned", "Waiting on customer" | P0 |
| **Bulk actions** | Mass assign, close, tag, prioritize selected tickets | P0 |
| **Ticket timeline** | Full conversation history with internal notes interspersed | P0 |
| **Customer context sidebar** | Show contact details, recent tickets, deals, purchases, timeline alongside ticket | P0 |
| **Ticket satisfaction** | Post-resolution CSAT survey (thumbs up/down or 1-5 stars) | P0 |
| **Ticket export** | Export ticket data and conversations for compliance or analysis | P1 |
| **Spam filtering** | Auto-detect and filter spam tickets | P1 |
| **Auto-close** | Close tickets after X days in "Pending" with no customer response | P1 |

### 5.2 Omnichannel Support

| Feature | Description | Priority |
|---------|-------------|----------|
| **Email channel** | Inbound/outbound support email (support@yourdomain.com) | P0 |
| **Live chat widget** | Embeddable chat widget for website | P0 |
| **Chat to ticket** | Convert chat conversations into tickets for follow-up | P0 |
| **Chatbot** | Rule-based chatbot for common questions; hand-off to agent | P1 |
| **AI chatbot** | AI-powered responses from knowledge base (RAG) | P2 |
| **Contact forms** | Web forms that create tickets (integrated with Marketing forms) | P0 |
| **Facebook Messenger** | Receive/reply to Messenger messages as tickets | P2 |
| **WhatsApp** | WhatsApp Business integration for ticket conversations | P2 |
| **Phone/VoIP** | Inbound call logging; integration with Twilio for click-to-call | P2 |
| **SMS** | Send/receive SMS for ticket updates | P2 |
| **Unified thread** | If a customer contacts via chat then email, conversations merge into one thread | P1 |

### 5.3 SLA Management

Inspired by Zendesk and Freshdesk SLA features.

| Feature | Description | Priority |
|---------|-------------|----------|
| **SLA policies** | Define response and resolution time targets by priority level | P0 |
| **Multiple SLAs** | Different SLA policies per customer tier, category, or product | P1 |
| **SLA clock** | Timer visible on each ticket showing time remaining | P0 |
| **Business hours** | SLA clocks respect business hours and holidays | P0 |
| **SLA breach alerts** | Notifications when tickets are approaching or have breached SLA | P0 |
| **SLA escalation** | Auto-escalate: reassign, notify manager, increase priority on breach | P1 |
| **SLA reporting** | SLA compliance rates, average response/resolution times, breach analysis | P0 |
| **Pause SLA** | Pause clock when waiting on customer response | P0 |
| **SLA by channel** | Different targets for chat (seconds) vs. email (hours) | P1 |

### 5.4 Knowledge Base

| Feature | Description | Priority |
|---------|-------------|----------|
| **Article editor** | Rich text editor with images, videos, code blocks, callouts, tables | P0 |
| **Categories & sections** | Hierarchical organization: Category → Section → Article | P0 |
| **Search** | Full-text search with relevance ranking | P0 |
| **Public/internal KB** | Separate customer-facing and internal agent knowledge bases | P0 |
| **Article versioning** | Track changes, revert to previous versions | P1 |
| **Article templates** | Standardized formats: FAQ, How-To, Troubleshooting, Reference | P1 |
| **Article feedback** | "Was this helpful?" with comments; track article effectiveness | P0 |
| **Related articles** | Auto-suggest related articles based on content similarity | P1 |
| **Multi-language** | Translate articles into multiple languages | P2 |
| **SEO optimization** | Meta tags, custom URLs, sitemap generation | P1 |
| **Access control** | Restrict articles to logged-in customers, specific tiers, or internal only | P1 |
| **Article suggestions** | When agent replies to a ticket, suggest relevant KB articles to link | P1 |
| **Draft workflow** | Draft → Review → Published lifecycle with approval | P1 |
| **Analytics** | Views, search queries (especially failed searches), article performance | P0 |
| **Embeddable widget** | In-app help widget that searches KB and offers chat fallback | P1 |

### 5.5 Live Chat

| Feature | Description | Priority |
|---------|-------------|----------|
| **Chat widget** | Customizable widget: colors, position, welcome message, agent photos | P0 |
| **Pre-chat form** | Collect name/email before chat starts | P0 |
| **Typing indicators** | Both sides see when the other is typing | P0 |
| **File sharing** | Send/receive files and images in chat | P0 |
| **Chat routing** | Route to available agent by skill, team, or round-robin | P0 |
| **Chat queue** | Queue management when all agents are busy; estimated wait time | P0 |
| **Canned chat responses** | Quick replies for common questions | P0 |
| **Chat transfer** | Transfer conversation to another agent or team | P0 |
| **Chat hours** | Show widget only during business hours; offline form otherwise | P1 |
| **Visitor info** | Show pages visited, location, device info to agent | P0 |
| **Chat history** | Full conversation history accessible on contact timeline | P0 |
| **Proactive chat** | Auto-trigger chat based on page, time on site, or scroll depth | P2 |
| **Chat satisfaction** | Post-chat CSAT survey | P1 |
| **Agent availability** | Online/away/offline status management | P0 |
| **Chat concurrency** | Max simultaneous chats per agent (configurable) | P0 |

### 5.6 Customer Feedback & Satisfaction

| Feature | Description | Priority |
|---------|-------------|----------|
| **CSAT surveys** | Post-ticket and post-chat satisfaction rating | P0 |
| **NPS surveys** | Net Promoter Score surveys on schedule or triggered | P1 |
| **CES surveys** | Customer Effort Score for specific interactions | P2 |
| **Survey builder** | Customizable survey questions and appearance | P1 |
| **Survey triggers** | Send after ticket close, after purchase, on schedule, manual | P0 |
| **Score tracking** | Per-contact, per-agent, and aggregate scores over time | P0 |
| **Feedback dashboard** | Trends, scores by team/agent/category/product | P1 |
| **Detractor alerts** | Notify manager when CSAT/NPS is negative | P1 |

### 5.7 Automation & Productivity

| Feature | Description | Priority |
|---------|-------------|----------|
| **Ticket macros** | One-click actions: set fields + add reply + assign in one action | P0 |
| **Trigger rules** | On ticket creation/update: auto-set fields, notify, assign, tag | P0 |
| **Time-based rules** | "If ticket unresponded for 4 hours, notify team lead" | P1 |
| **Auto-replies** | Auto-send acknowledgment email on ticket creation | P0 |
| **Suggested replies** | AI-suggested reply based on ticket content and KB articles | P2 |
| **Ticket summarization** | AI summary of long ticket threads | P2 |
| **Similar tickets** | Show similar past tickets with their resolutions | P2 |

---

## Data Model

```
┌─────────────────┐
│     Ticket       │
│                  │
│ id               │
│ tenant_id        │
│ number           │  (human-readable: T-1001)
│ subject          │
│ status           │  (new, open, pending, on_hold, resolved, closed)
│ priority         │  (urgent, high, normal, low)
│ category_id      │  → TicketCategory
│ contact_id       │  → Contact
│ company_id       │  → Company
│ assigned_to      │  → User (agent)
│ assigned_team    │  → Team
│ channel          │  (email, chat, form, phone, social, manual)
│ sla_policy_id    │  → SLAPolicy
│ first_response_at│
│ resolved_at      │
│ closed_at        │
│ sla_first_response_due │
│ sla_resolution_due     │
│ sla_breached     │
│ sla_paused_at    │
│ satisfaction     │  (good, bad, null)
│ satisfaction_comment │
│ tags             │  (text[])
│ custom_props     │  (JSONB)
│ source_data      │  (JSONB: original email headers, form ID, chat session, etc.)
│ parent_ticket_id │  → Ticket (for sub-tickets)
│ merged_into_id   │  → Ticket (if merged)
│ created_at       │
│ updated_at       │
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│  TicketMessage   │
│                  │
│ id               │
│ ticket_id        │
│ type             │  (reply, note, system)
│ direction        │  (inbound, outbound, internal)
│ from_contact     │  (true if customer message)
│ user_id          │  → User (agent, if outbound/note)
│ body_html        │
│ body_text        │
│ attachments      │  (JSONB: [{name, url, size, mime_type}])
│ created_at       │
└─────────────────┘

┌─────────────────┐
│  SLAPolicy       │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ is_default       │
│ conditions       │  (JSONB: when this SLA applies — priority, category, tier)
│ targets          │  (JSONB: { urgent: {first_response: 60, resolution: 240}, ... })
│ business_hours_id│
│ priority         │  (evaluation order)
└─────────────────┘

┌─────────────────┐
│ BusinessHours    │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ timezone         │
│ schedule         │  (JSONB: [{day: 'mon', start: '09:00', end: '17:00'}, ...])
│ holidays         │  (JSONB: [{date: '2026-12-25', name: 'Christmas'}])
└─────────────────┘

┌─────────────────┐
│ TicketCategory   │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ parent_id        │  → self (hierarchy)
│ description      │
│ position         │
└─────────────────┘

┌─────────────────┐        ┌─────────────────┐
│   KBCategory     │──1:M──▶│   KBSection     │
│                  │        │                  │
│ id               │        │ id               │
│ tenant_id        │        │ category_id      │
│ name             │        │ name             │
│ slug             │        │ slug             │
│ description      │        │ description      │
│ icon             │        │ position         │
│ position         │        └───────┬──────────┘
│ visibility       │                │ 1:M
│ (public/internal)│                ▼
└─────────────────┘        ┌─────────────────┐
                           │   KBArticle      │
                           │                  │
                           │ id               │
                           │ tenant_id        │
                           │ section_id       │
                           │ title            │
                           │ slug             │
                           │ body_html        │
                           │ body_json        │ (editor state)
                           │ status           │ (draft, review, published, archived)
                           │ author_id        │
                           │ visibility       │ (public, internal, restricted)
                           │ seo_title        │
                           │ seo_description  │
                           │ helpful_count    │
                           │ not_helpful_count│
                           │ view_count       │
                           │ position         │
                           │ published_at     │
                           │ version          │
                           └─────────────────┘

┌─────────────────┐
│  ChatSession     │
│                  │
│ id               │
│ tenant_id        │
│ contact_id       │
│ agent_id         │  → User
│ status           │  (waiting, active, transferred, ended)
│ channel          │  (web_chat, messenger, whatsapp)
│ started_at       │
│ first_response_at│
│ ended_at         │
│ ticket_id        │  (if converted to ticket)
│ satisfaction     │
│ metadata         │  (JSONB: visitor info, pages viewed, device)
└───────┬──────────┘
        │ 1:M
        ▼
┌─────────────────┐
│  ChatMessage     │
│                  │
│ id               │
│ session_id       │
│ sender_type      │  (contact, agent, bot, system)
│ sender_id        │
│ body             │
│ attachments      │  (JSONB)
│ created_at       │
└─────────────────┘

┌─────────────────┐
│  SurveyResponse  │
│                  │
│ id               │
│ tenant_id        │
│ contact_id       │
│ type             │  (csat, nps, ces)
│ score            │
│ comment          │
│ trigger_type     │  (ticket, chat, purchase, manual)
│ trigger_id       │
│ responded_at     │
└─────────────────┘

┌─────────────────┐
│   TicketMacro    │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ actions          │  (JSONB: [{set_status: 'resolved'}, {set_priority: 'low'}, {reply: '...'}])
│ visibility       │  (personal, team, global)
│ created_by       │
│ usage_count      │
└─────────────────┘
```

---

## Key Workflows

### Inbound Email → Ticket Flow

```
1. Email received at support@tenant-domain.com
2. Parse: extract sender, subject, body (HTML + text), attachments
3. Check if this is a reply to existing ticket:
   a. Match by In-Reply-To / References headers → existing ticket
   b. Match by subject line pattern (e.g., "Re: [T-1234]") → existing ticket
   c. If match → add message to existing ticket; reopen if resolved/closed
4. If new ticket:
   a. Look up contact by sender email
   b. If no contact → create new contact
   c. Create ticket with parsed data
   d. Apply routing rules (category detection, priority inference)
   e. Apply SLA policy (match conditions)
   f. Auto-assign (round-robin, rules, or leave unassigned)
5. Send auto-acknowledgment email to customer
6. Emit: ticket.created
7. Notify assigned agent (in-app + email)
```

### Live Chat Flow

```
1. Visitor opens chat widget
2. Pre-chat: show KB article suggestions based on current page
3. If visitor needs agent:
   a. Collect name/email (or auto-identify for known contacts)
   b. Check agent availability; show queue position if busy
   c. Route to available agent (skill/team match)
4. Agent receives notification; chat begins
5. Agent can:
   - View visitor's page history, contact details, recent tickets
   - Send canned responses
   - Share KB articles inline
   - Transfer to another agent
   - Create ticket from chat
6. When chat ends:
   a. Show CSAT survey
   b. Log chat transcript to contact timeline
   c. Create ticket if issue unresolved
7. Emit: chat.completed
```

---

## Events Emitted

| Event | Consumers |
|-------|-----------|
| `ticket.created` | Data, CRM (timeline), Notifications |
| `ticket.updated` | Data, Notifications, SLA tracker |
| `ticket.assigned` | Notifications, Data |
| `ticket.resolved` | CSAT survey trigger, Data |
| `ticket.sla_warning` | Notifications (approaching breach) |
| `ticket.sla_breached` | Notifications, Escalation rules |
| `chat.started` | Data, CRM (timeline) |
| `chat.completed` | Data, CSAT trigger, CRM (timeline) |
| `kb.article.published` | Search (index), Chatbot (knowledge update) |
| `survey.responded` | Data, CRM (satisfaction property), Notifications (detractor alert) |

---

## AI/ML Opportunities

1. **Auto-categorization** — Classify tickets by category based on content analysis
2. **Priority prediction** — Suggest priority based on content, customer tier, sentiment
3. **Smart routing** — Route to the agent most likely to resolve quickly (based on historical resolution data)
4. **Suggested replies** — Generate reply drafts using ticket content + KB articles (RAG)
5. **Ticket summarization** — Summarize long threads into key points for agents picking up tickets
6. **Similar ticket search** — Find past tickets with similar issues and their resolutions
7. **KB gap analysis** — Identify common ticket topics with no KB articles; suggest articles to write
8. **Sentiment analysis** — Real-time sentiment tracking in chat; alert supervisor for negative sentiment
9. **Chatbot (RAG)** — AI chatbot that answers from KB with source citations; escalates to human when uncertain

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| High ticket volume (10K+/day) | Async processing pipeline; bulk operations; smart views with server pagination |
| Live chat concurrency | WebSocket server with Redis pub/sub for multi-instance; horizontal scaling |
| Chat message delivery | Optimistic UI + server confirmation; message ordering guarantees via sequence numbers |
| KB search relevance | OpenSearch with custom ranking (recency, popularity, feedback score) |
| SLA computation | Background worker that periodically checks approaching deadlines; pre-computed next-breach-at timestamps |
| Email parsing | Dedicated worker pool; handle attachments asynchronously |
| CSAT aggregation | Materialized views refreshed on new survey responses |
