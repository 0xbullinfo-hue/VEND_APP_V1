# VEND Execution Workplan (External Technical Supervision Format)
Date: 2026-07-02
Program Goal: Ship a premium marketplace app where customers can discover live vendors by locality on an interactive map, with high trust and high conversion UX.

## 1) Governance Model
- Delivery rhythm: 2-week sprints
- Checkpoint cadence: weekly technical supervision review
- Quality gates: design QA, type check, integration check, performance smoke test
- Definition of done: accepted against product, UX, engineering, and security criteria

## 2) Workstreams
### WS1: Real-time Vendor Visibility Engine
- Enable Supabase runtime client and environment validation
- Build locality-scoped vendor query contract
- Add realtime subscription channel for vendor status/location updates
- Add client reconciliation logic for marker updates and stale presence expiry

### WS2: Premium Discovery UX
- Deliver category discovery modes:
  - Grid mode (2clicks-inspired visual browsing)
  - Split mode (Jiji-inspired dense drill-down)
- Add map/list synchronized browsing model
- Upgrade map marker language (online, boosted, home-based masked)
- Improve bottom sheet action density and clarity

### WS3: Taxonomy and Information Architecture
- Create single category source-of-truth
- Normalize category usage across Home, Explore, Vendor setup, and filtering logic
- Add compatibility aliasing for legacy categories during migration window

### WS4: Trust, Safety, and Privacy
- Keep masked coordinates for home vendors by default
- Unlock exact location after approved direction workflow only
- Add anti-abuse/rate limits and observability metrics

### WS5: Platform Reliability and Metrics
- Add app-level tests for discovery, filtering, and navigation flows
- Add analytics events for funnel and retention tracking
- Add performance baselines for map rendering and marker updates

## 3) Sprint Plan
### Sprint 1 (Now)
- Fix category consistency and routing handoffs
- Implement premium category UX uplift in Explore
- Finalize execution docs and review governance

### Sprint 2
- Runtime Supabase enablement and vendor fetch integration
- Locality-filtered query and map data contract
- Presence schema and heartbeat path baseline

### Sprint 3
- Realtime subscription rendering in customer map
- Marker clustering and viewport-aware rendering
- Presence stale-state management and resilience rules

### Sprint 4
- Vendor location setup map picker + reverse geocode
- Quality and trust badges in vendor cards
- Metrics dashboard for conversion and locality coverage

## 4) Acceptance Criteria by Stream
### Real-time engine
- Customer map reflects vendor online/offline changes within 5-10s
- Locality filter always applied before marker render
- Masked home location remains enforced by policy

### UX
- User can browse categories in grid and split modes
- Search + category + subcategory combinations always return deterministic results
- Navigation actions land users on intended tab/screen with no dead-end loops

### Reliability
- TypeScript check passes with no new errors
- Key discovery flows covered by automated tests

## 5) Immediate Tasking (Current Change Set)
- Introduce centralized category catalog module
- Refactor Home and Explore to use shared taxonomy
- Add Explore mode switch (grid/split) and premium visual upgrade
- Fix tab handoff routing for category and rewards actions
- Commit changes and push to remote repository
