# AlphaBAG SEO + AEO Implementation Plan
Date: 2026-08-08
Program Goal: Increase AlphaBAG visibility across search engines and answer engines while improving technical performance, crawlability, authority, and machine readability across the public landing experience, the authenticated user dashboard, and the backend content/API layer.

## 1) Objectives
- Grow branded and non-branded discoverability for AlphaBAG.
- Improve crawlability and index quality of public-facing content.
- Make AlphaBAG easier for AI answer systems to interpret, quote, and rank.
- Improve performance and information architecture on both marketing and product surfaces.
- Build stronger local and topical authority with supporting content and structured backend capabilities.

## 2) Success Metrics
### Search visibility
- Increase non-branded organic impressions by 60% in 90 days.
- Increase branded query impressions for AlphaBAG terms by 100% in 90 days.
- Improve click-through rate on core landing queries by 20%.

### Answer engine visibility
- Reach top-3 answer visibility for priority prompts in at least 40% of tracked queries.
- Increase citation-ready content coverage across security, methodology, roadmap, and network support pages.

### Technical performance
- Achieve mobile LCP under 2.2s on public landing routes.
- Keep CLS under 0.1 and INP under 200ms.
- Reduce landing-page initial JS cost to a defined budget and prevent regressions.

### Authority and conversion
- Increase waitlist/community conversion rate from organic landing traffic by 25%.
- Increase impressions and CTR from target local markets through localized content.

## 3) Delivery Structure
Work is grouped into three implementation surfaces:
- Landing Page: public acquisition, indexing, messaging, schema, authority pages, and conversion.
- User Dashboard: authenticated/app routes, performance, route discoverability, internal linking, and trust documentation references.
- Backend: structured data support, metadata endpoints, sitemap/robots generation, content freshness, telemetry, and content APIs.

## 4) Landing Page Tasks
Target repo surface:
- repo_audit/Alphabag_V3_FRONTEND/src/pages/frontend/Landing.tsx
- repo_audit/Alphabag_V3_FRONTEND/src/App.tsx
- repo_audit/Alphabag_V3_FRONTEND/index.html
- repo_audit/Alphabag_V3_FRONTEND/src/index.css

### LP1: Convert marketing content into crawl-stable route structure
- Break tab-based landing content into route-addressable public pages or prerendered route variants.
- Create separate crawlable routes for:
  - Home
  - Features
  - Tokenomics
  - AlphaMap
  - FAQ
  - Markets overview
- Preserve current UX while exposing stable URLs for bots and internal linking.
- Acceptance criteria:
  - Each section has a unique URL, title, meta description, and canonical.
  - Bots can access primary content without relying on client-only tab toggles.

### LP2: Expand metadata and structured data coverage
- Keep Organization, WebSite, SoftwareApplication, and FAQPage schema synchronized with visible text.
- Add BreadcrumbList schema for all public routes.
- Add Product/Offer schema for tier or access-related sections where applicable.
- Add explicit sameAs references and improve brand entity consistency.
- Acceptance criteria:
  - Structured data validates cleanly.
  - Page-level metadata is route-specific, not generic.

### LP3: Build answer-engine-friendly content blocks
- Add concise direct-answer summaries at top of key sections.
- Convert repeated product concepts into standardized question/answer or summary patterns.
- Add short answer blocks for:
  - What is AlphaBAG?
  - How does AlphaAI work?
  - How does Genesis access work?
  - Which networks are supported?
  - Is wallet tracking secure?
- Acceptance criteria:
  - Each answer block is 40 to 70 words.
  - Content is extractable as standalone answers.

### LP4: Publish authority-supporting public pages
- Create standalone public pages for:
  - Security Model
  - Methodology
  - Network Coverage
  - Release Notes / Changelog
  - AI Limitations and Data Freshness
- Link these pages from landing, FAQ, footer, and schema references where relevant.
- Acceptance criteria:
  - All pages are indexable and internally linked.
  - Trust and methodology claims on landing link to a supporting source page.

### LP5: Improve landing-page technical performance
- Defer heavy wallet/web3 logic from first meaningful paint on marketing routes.
- Audit lazy-loading boundaries in App.tsx and Landing.tsx.
- Reduce non-critical JavaScript on landing path.
- Optimize hero image loading, font loading, and above-the-fold CSS behavior.
- Acceptance criteria:
  - Public landing route ships materially less JS than authenticated product routes.
  - Performance budgets are documented and enforced.

### LP6: Improve local authority landing variants
- Create geo-targeted landing pages for priority markets.
- Add hreflang and region-specific copy where there is true localization value.
- Focus initial rollout on a small number of strategic regions.
- Acceptance criteria:
  - Local pages are not thin duplicates.
  - Region pages carry distinct copy, proof points, and supporting metadata.

### LP7: Strengthen internal linking and information architecture
- Link FAQ items to supporting pages.
- Link AlphaMap milestones to release notes or methodology pages once available.
- Link hero, features, and roadmap sections into product explanation pages.
- Acceptance criteria:
  - Every priority landing page is within 3 clicks of the homepage.
  - No critical public content is isolated.

## 5) User Dashboard Tasks
Target repo surface:
- repo_audit/Alphabag_V3_FRONTEND/src/App.tsx
- repo_audit/Alphabag_V3_FRONTEND/src/pages/frontend/*
- repo_audit/Alphabag_V3_FRONTEND/src/components/frontend/*
- repo_audit/Alphabag_V3_FRONTEND/src/services/*

### UD1: Separate marketing and app performance concerns
- Ensure authenticated dashboard bundles do not leak unnecessary cost into public routes.
- Review lazy-loading boundaries for calculator, markets, AlphaAI, whales, news, portfolio, and scanner pages.
- Move any unneeded provider initialization off public entry paths.
- Acceptance criteria:
  - Marketing route and authenticated route budgets are measured separately.
  - Product-only modules are not loaded on public landing unless needed.

### UD2: Add route-level metadata for indexable public product surfaces
- Public routes such as markets, coin detail, and any public intelligence pages need route-specific metadata.
- Ensure public dashboard-adjacent pages expose machine-readable titles and descriptions based on content.
- Acceptance criteria:
  - Public routes have unique metadata.
  - Search engines can distinguish markets pages and detail pages by intent.

### UD3: Improve machine readability of public app surfaces
- Standardize page intros for Markets, Integrations, Alpha Calls, and any public content-rich route.
- Add short definitions and summary blocks above data-dense sections.
- Add visible update timestamps where data freshness matters.
- Acceptance criteria:
  - Each public-facing route explains itself before showing dense UI.
  - Data-rich interfaces are understandable to human readers and extraction systems.

### UD4: Strengthen trust and product understanding inside the app
- Link public trust pages from portfolio, wallet, AI, and security-related surfaces.
- Add contextual “How this works” or “Security model” references where users need confidence.
- Acceptance criteria:
  - Sensitive features link to supporting trust content.
  - Product terminology is consistent across landing and dashboard.

### UD5: Add product telemetry for SEO/AEO-informed optimization
- Instrument product-adjacent user flows that show which content attracts and retains users.
- Measure conversions from organic/public pages into waitlist, community, and authenticated flows.
- Acceptance criteria:
  - Events exist for key acquisition and activation journeys.
  - Content teams can identify high-intent entry pages and high-conversion copy blocks.

### UD6: Create indexable educational product pages where appropriate
- Consider dedicated public educational pages for:
  - Whale tracking explained
  - Multi-chain portfolio tracking explained
  - AlphaAI signals explained
  - Security scanning explained
- Use these as SEO/AEO bridges into the product ecosystem.
- Acceptance criteria:
  - Each educational page targets a real query cluster.
  - Each page links naturally into relevant app functionality.

## 6) Backend Tasks
Target repo surface:
- repo_audit/alphabag_v3_backend/src/routes
- repo_audit/alphabag_v3_backend/src/controllers
- repo_audit/alphabag_v3_backend/src/services
- repo_audit/alphabag_v3_backend/server.js

### BE1: Support metadata and content freshness APIs
- Provide backend endpoints for:
  - sitemap generation or update feed
  - public changelog entries
  - network coverage data
  - public methodology references
  - content last-updated timestamps
- Acceptance criteria:
  - Public pages can consume authoritative freshness data from backend.
  - Content update timestamps are consistent across UI and structured data.

### BE2: Add searchable public content contracts
- Expose clean JSON for public content blocks that may be reused across landing, docs, and app pages.
- Centralize entities such as supported networks, product definitions, and release milestones.
- Acceptance criteria:
  - Public content entities are maintained in one authoritative source.
  - Frontend and SEO pages do not drift semantically.

### BE3: Build observability for acquisition and answer quality
- Log and aggregate public route activity, referrers, and high-intent entry sources where policy allows.
- Track content freshness and content publish/update states.
- Acceptance criteria:
  - Technical and content teams can detect stale pages and weak acquisition routes.
  - Backend supports visibility reporting over time.

### BE4: Improve robots, sitemap, and indexing support
- Generate or validate robots.txt behavior for public surfaces.
- Publish XML sitemap entries for landing pages, public docs pages, and public educational pages.
- Include lastmod for freshness signals.
- Acceptance criteria:
  - Sitemap is complete, clean, and regularly updated.
  - No non-public app routes are accidentally surfaced for indexing.

### BE5: Support local authority content operations
- Create backend-managed content capability for region pages, citations, and localized trust content if scale requires it.
- Track locale-level update history.
- Acceptance criteria:
  - Localized content can be updated without frontend duplication drift.
  - Regional pages retain structured metadata support.

## 7) Priority Order
### Phase 1: Immediate foundation
- LP1 route structure for public content
- LP2 schema and metadata expansion
- LP5 landing performance budget and bundle reduction
- UD1 route-level performance separation
- BE4 sitemap and robots support

### Phase 2: Authority and answer-engine coverage
- LP3 answer blocks
- LP4 trust/methodology pages
- UD3 public app route readability improvements
- BE1 freshness/content metadata endpoints
- BE2 centralized public content contracts

### Phase 3: Local growth and scale
- LP6 localized landing variants
- UD6 educational product pages
- BE5 locale-aware content support
- BE3 visibility observability for ongoing optimization

## 8) 90-Day Sprint Breakdown
### Sprint 1
- Audit current metadata, schema, route structure, and bundle costs.
- Define keyword clusters, entity vocabulary, and answer-engine prompt list.
- Implement public-route metadata and canonical cleanup.
- Add performance budgets and reporting baselines.

### Sprint 2
- Expose route-level public landing sections or prerenderable variants.
- Update sitemap/robots support.
- Publish revised structured data and answer blocks.
- Start reducing landing-route JS cost.

### Sprint 3
- Ship Security Model, Methodology, and Network Coverage pages.
- Add supporting internal links from landing and FAQ.
- Introduce freshness/update timestamps where appropriate.

### Sprint 4
- Improve markets/public app route intros and metadata.
- Add educational public product pages.
- Instrument acquisition-to-conversion events.

### Sprint 5
- Launch first localized region pages with hreflang.
- Support regional trust content and localized metadata.
- Begin digital PR and authority-building campaign support.

### Sprint 6
- Measure outcomes from Search Console, analytics, and answer-engine tracking.
- Refresh weak pages, expand strong clusters, and tighten performance regressions.

## 9) Acceptance Criteria
### Search and AEO
- Public AlphaBAG pages have stable URLs, route-specific metadata, and synchronized schema.
- Key product questions are answered in concise, extractable language.
- Trust, methodology, and network coverage claims are backed by dedicated public pages.

### Performance
- Landing and public content routes stay within defined budgets.
- No unnecessary authenticated/product bundle cost is loaded onto public acquisition pages.

### Content and authority
- Brand terminology is consistent across landing, dashboard, backend content, and schema.
- Localized pages provide meaningful local relevance, not duplicate copy.

### Backend support
- Sitemap, robots, freshness, and public content contracts support frontend discoverability goals.

## 10) Immediate Tasking
### Landing Page
- Split current landing tabs into crawlable route variants.
- Expand schema and route-specific metadata.
- Publish Security Model, Methodology, Network Coverage, and Changelog pages.
- Add answer-first blocks and stronger internal links.
- Reduce landing route JS and improve Core Web Vitals.

### User Dashboard
- Keep authenticated product cost isolated from public routes.
- Improve public route intros and metadata for markets and content pages.
- Add trust references and educational public product pages.
- Instrument acquisition-to-activation analytics.

### Backend
- Implement sitemap/robots and public freshness support.
- Centralize public product entity content.
- Add visibility observability and regional content support.

## 11) Recommended Owners
- Frontend engineering: Landing route architecture, metadata, schema rendering, performance budgets, public route readability.
- Backend engineering: Sitemap/robots, freshness endpoints, content contracts, observability, regional content support.
- Content/SEO: Query mapping, entity map, answer blocks, trust pages, localized copy, internal linking strategy.
- Growth/PR: Regional authority campaigns, citations, backlink outreach, distribution of thought-leadership content.
