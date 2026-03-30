# 06 — Content Module

## Overview

The Content module provides a headless CMS for managing website content, blog posts, digital assets, and SEO tools. Unlike standalone CMS platforms, every piece of content is deeply integrated with the CRM — enabling personalization, attribution, and lead generation natively.

**Key personas:** Content marketers, SEO specialists, blog editors, web developers, marketing managers.

**Benchmark tools:** WordPress, Webflow, Contentful, Strapi, HubSpot CMS, Ghost, Sanity.

---

## Feature Inventory

### 6.1 Page & Content Management

| Feature | Description | Priority |
|---------|-------------|----------|
| **Block editor** | Notion/Gutenberg-style block editor: text, images, video, embeds, columns, code, callouts, tables, dividers, accordions, tabs | P0 |
| **Page types** | Website pages, blog posts, landing pages, case studies, documentation pages | P0 |
| **Templates** | Page templates with locked sections and editable zones | P1 |
| **Content types** | Custom content types with defined field schemas (headless CMS approach) — e.g., "Case Study" has: title, customer, industry, challenge, solution, results | P1 |
| **Content hierarchy** | Parent/child pages with breadcrumb navigation | P0 |
| **URL management** | Custom slugs, auto-generated from title, URL redirects | P0 |
| **Multi-language** | Content translation management with per-locale versions | P2 |
| **Scheduling** | Schedule publish/unpublish dates | P1 |
| **Versioning** | Full version history with diff view and rollback | P0 |
| **Draft/publish workflow** | Draft → In Review → Approved → Published lifecycle | P0 |
| **Collaboration** | Multiple editors; lock indicator when someone is editing | P1 |
| **Preview** | Live preview of draft content before publishing | P0 |
| **Personalization** | Show/hide content blocks based on CRM contact properties or segment | P2 |
| **A/B testing** | Test page variants; auto-select winner based on conversion goal | P2 |
| **Comments** | Internal comments on content for editorial workflow | P1 |

### 6.2 Blog

| Feature | Description | Priority |
|---------|-------------|----------|
| **Blog engine** | Fully-featured blog with categories, tags, authors | P0 |
| **Blog listing page** | Auto-generated blog index with filtering and pagination | P0 |
| **Author profiles** | Author bios, photos, social links on posts | P0 |
| **Categories & tags** | Hierarchical categories + flat tags | P0 |
| **Featured posts** | Pin posts to top; featured image/hero image | P0 |
| **RSS feed** | Auto-generated RSS/Atom feed | P0 |
| **Reading time** | Auto-calculated estimated reading time | P1 |
| **Related posts** | Auto-suggest related posts based on tags/categories/content similarity | P1 |
| **Social sharing** | Share buttons with OG meta tags | P0 |
| **Comments system** | Optional visitor comments with moderation | P2 |
| **Newsletter CTA** | Embedded email signup (integrated with Marketing forms) | P0 |
| **Content calendar** | Visual calendar of scheduled and published content | P1 |

### 6.3 Digital Asset Management (DAM)

| Feature | Description | Priority |
|---------|-------------|----------|
| **File library** | Central storage for images, documents, videos, downloads | P0 |
| **Image optimization** | Auto-resize, compress, generate responsive srcset | P0 |
| **Image editing** | Basic: crop, resize, rotate; filters | P1 |
| **Folders & tags** | Organize assets in folders with tags for cross-referencing | P0 |
| **Search** | Search by filename, tags, metadata, alt text | P0 |
| **CDN delivery** | Serve assets through CloudFront CDN | P0 |
| **Usage tracking** | See where each asset is used across content | P1 |
| **Bulk upload** | Drag-and-drop multiple files; ZIP upload | P0 |
| **File type support** | Images (JPG, PNG, GIF, SVG, WebP), PDFs, Videos (MP4), Documents (DOCX, XLSX) | P0 |
| **Alt text management** | Required alt text for accessibility; AI-generated suggestions | P1 |
| **Brand kit** | Centralized brand assets: logos, fonts, color palettes | P2 |

### 6.4 SEO Tools

| Feature | Description | Priority |
|---------|-------------|----------|
| **On-page SEO** | Per-page: meta title, description, canonical URL, OG image, OG title/description | P0 |
| **SEO recommendations** | Real-time suggestions while editing: keyword density, heading structure, meta length, alt tags | P1 |
| **Sitemap** | Auto-generated XML sitemap submitted to search engines | P0 |
| **Robots.txt** | Editable robots.txt | P0 |
| **Structured data** | Auto-generated JSON-LD for articles, FAQs, products, org | P1 |
| **Redirect manager** | Create/manage 301/302 redirects; auto-redirect on slug change | P0 |
| **Broken link checker** | Periodic scan for broken internal and external links | P2 |
| **SEO audit** | Site-wide SEO health score with actionable recommendations | P2 |
| **Search console integration** | Import Google Search Console data for keyword tracking | P2 |
| **Internal linking suggestions** | Suggest internal links based on content analysis | P2 |

### 6.5 Theming & Rendering

| Feature | Description | Priority |
|---------|-------------|----------|
| **Theme system** | Global site theme: colors, fonts, spacing, header/footer | P0 |
| **Header/footer editor** | Visual editor for site-wide navigation and footer | P0 |
| **CSS customization** | Custom CSS injection per page or globally | P1 |
| **Component library** | Reusable page sections: hero, feature grid, testimonials, pricing table, CTA | P1 |
| **Responsive preview** | Preview at desktop, tablet, and mobile breakpoints | P0 |
| **Dark mode** | Site theme supports dark mode toggle | P2 |
| **Custom code injection** | Add custom HTML/JS/CSS in head or body (for analytics, chatbots, etc.) | P1 |

---

## Data Model

```
┌─────────────────┐
│   ContentPage    │
│                  │
│ id               │
│ tenant_id        │
│ type             │  (page, blog_post, landing_page, case_study, custom)
│ content_type_id  │  → ContentType (for custom types)
│ title            │
│ slug             │
│ body_json        │  (JSONB: block editor state)
│ body_html        │  (rendered HTML)
│ excerpt          │
│ featured_image   │  → Asset
│ status           │  (draft, in_review, approved, published, archived)
│ author_id        │  → User
│ parent_id        │  → ContentPage (hierarchy)
│ template_id      │  → PageTemplate
│ category_id      │  → ContentCategory
│ tags             │  (text[])
│ seo_title        │
│ seo_description  │
│ og_image         │
│ canonical_url    │
│ structured_data  │  (JSONB)
│ custom_fields    │  (JSONB: for custom content types)
│ published_at     │
│ scheduled_at     │
│ unpublish_at     │
│ version          │
│ locale           │  (en, es, fr, etc.)
│ locale_group_id  │  (links translations together)
│ view_count       │
│ word_count       │
│ reading_time_min │
│ created_at       │
│ updated_at       │
└─────────────────┘

┌─────────────────┐
│ ContentVersion   │
│                  │
│ id               │
│ page_id          │
│ version          │
│ body_json        │
│ title            │
│ changed_by       │
│ change_summary   │
│ created_at       │
└─────────────────┘

┌─────────────────┐
│  ContentType     │  (headless CMS custom types)
│                  │
│ id               │
│ tenant_id        │
│ name             │  (e.g., "Case Study", "Product", "Team Member")
│ slug             │
│ fields           │  (JSONB: [{name, type, required, options}])
│ template_id      │
│ icon             │
└─────────────────┘

┌─────────────────┐
│ ContentCategory  │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ slug             │
│ description      │
│ parent_id        │  → self
│ position         │
│ type             │  (blog, page, case_study)
└─────────────────┘

┌─────────────────┐
│     Asset        │
│                  │
│ id               │
│ tenant_id        │
│ filename         │
│ original_name    │
│ mime_type        │
│ size_bytes       │
│ s3_key           │
│ cdn_url          │
│ width            │  (for images)
│ height           │
│ alt_text         │
│ title            │
│ folder_id        │  → AssetFolder
│ tags             │  (text[])
│ metadata         │  (JSONB: EXIF, duration for video, etc.)
│ thumbnails       │  (JSONB: {sm: url, md: url, lg: url})
│ uploaded_by      │
│ created_at       │
└─────────────────┘

┌─────────────────┐
│  AssetFolder     │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ parent_id        │  → self
│ position         │
└─────────────────┘

┌─────────────────┐
│  PageTemplate    │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ body_json        │  (template structure with locked/editable zones)
│ page_type        │
│ thumbnail_url    │
│ is_system        │
└─────────────────┘

┌─────────────────┐
│   Redirect       │
│                  │
│ id               │
│ tenant_id        │
│ from_path        │
│ to_path          │
│ type             │  (301, 302)
│ created_at       │
│ hit_count        │
└─────────────────┘

┌─────────────────┐
│  SiteTheme       │
│                  │
│ id               │
│ tenant_id        │
│ name             │
│ config           │  (JSONB: colors, fonts, spacing, custom CSS)
│ header_json      │  (JSONB: header/nav structure)
│ footer_json      │  (JSONB: footer structure)
│ is_active        │
└─────────────────┘

┌─────────────────┐
│ ContentComment   │  (internal editorial comments)
│                  │
│ id               │
│ page_id          │
│ user_id          │
│ body             │
│ resolved         │
│ parent_id        │  → self (threaded)
│ created_at       │
└─────────────────┘
```

---

## Key Workflows

### Content Publishing Flow

```
1. Author creates new page/post in block editor
2. Author writes content, adds media from asset library
3. Author sets SEO fields (or accepts AI suggestions)
4. Author saves as draft
5. (If review workflow enabled):
   a. Author submits for review → status: in_review
   b. Reviewer gets notification
   c. Reviewer adds comments or approves → status: approved
6. Author/admin publishes:
   a. If scheduled: status stays approved, scheduler publishes at time
   b. If immediate: status → published, body rendered to HTML
7. Content version created
8. Sitemap regenerated (async)
9. OpenSearch index updated
10. Emit: content.published
11. Marketing module notified (for RSS email, social posting)
```

### Asset Upload Flow

```
1. User uploads file(s) via library or inline in editor
2. Validate: file type, size limits (configurable per tenant)
3. Upload to S3 with unique key (tenant/year/month/uuid.ext)
4. For images:
   a. Generate thumbnails (sm: 200px, md: 600px, lg: 1200px)
   b. Generate WebP variant
   c. Extract dimensions, EXIF data
   d. Generate CDN URL
5. Create Asset record
6. If inline in editor: return CDN URL for insertion
7. If library upload: show in file browser
```

---

## Events Emitted

| Event | Consumers |
|-------|-----------|
| `content.published` | Search (index), Marketing (RSS, social), Data (analytics) |
| `content.updated` | Search (re-index) |
| `content.unpublished` | Search (de-index), redirect check |
| `content.viewed` | Data (analytics), Marketing (page view tracking) |
| `asset.uploaded` | Data (storage metrics) |

---

## AI/ML Opportunities

1. **SEO content suggestions** — AI analyzes top-ranking content for target keywords; suggests outline, word count, headings
2. **Alt text generation** — Auto-generate descriptive alt text for uploaded images
3. **Content summarization** — Auto-generate excerpts and meta descriptions from content
4. **Internal linking** — Suggest relevant internal links as author writes
5. **Content performance prediction** — Predict traffic potential based on keyword difficulty and content quality
6. **Translation assistance** — AI-assisted translation with human review workflow
7. **Content repurposing** — Suggest how to repurpose a blog post into email, social posts, knowledge base article

---

## Scale Considerations

| Challenge | Solution |
|-----------|----------|
| Large asset libraries | S3 for storage with CDN; lazy-loading in asset browser; paginated API |
| Image serving at scale | CloudFront CDN with long cache TTLs; WebP with fallback; responsive images |
| Content rendering | Pre-render HTML on publish; serve from cache; only re-render on edit |
| Blog with 1000s of posts | Paginated listing with cursor-based pagination; category/tag indexes |
| Search across all content | OpenSearch with boosted relevance for title/headings; typo tolerance |
| Version history storage | Store diffs instead of full snapshots after first version |
