# VEND Premium Product and UX Technical Review
Date: 2026-07-02
Scope: Repository review, implementation audit, and premium roadmap focused on real-time vendor discovery by locality.

## 1) Executive Summary
VEND already has strong direction: map-first discovery, privacy-aware home-based masking, and a dual customer/vendor flow foundation.

However, the current implementation is still a prototype layer. The primary promise (customers see live vendors on map in real time) is not yet implemented end-to-end in production architecture. Data, auth, and location updates are still mock-driven in app runtime.

If you execute the roadmap below in order, VEND can move from prototype to premium marketplace utility app with defensible differentiation.

## 2) What Is Working Well Already
- Clear product thesis: map-led discovery with locality context and category browsing.
- Good conceptual privacy model for home-based vendors via masked coordinates and direction unlock flow.
- UI components and design system exist, enabling centralized visual upgrades.
- Supabase schema includes strong foundations: locality, vendor, secure location table, and a public masked view.

## 3) Highest-Risk Gaps (Blocking Premium Readiness)
### A. Real-time map promise is not wired to live backend data
- Supabase client is disabled in runtime app code.
- Vendor list and interactions are driven by static in-memory mock data.
- No subscription or streaming update path is connected for moving/open-close vendor state.

Impact:
- App cannot honestly deliver real-time vendor visibility at scale.

### B. Discovery logic has category model mismatches and data fragmentation
- Home categories do not match mock category taxonomy.
- Explore filtering relies on exact category name equality, causing likely empty/misleading results.

Impact:
- Users see inconsistent category behavior and low trust in search/discovery.

### C. Locality intelligence is not geospatially resolved yet
- Locality auto-detection currently hard-assigns a default locality id.
- Map does not enforce locality-based vendor querying in the core map flow.

Impact:
- Main value proposition (vendors in my locality now) is weakened.

### D. Navigation and marketplace IA are not yet premium-polished
- Home CTA routes back to tab root instead of a dedicated category destination state.
- Attached image style expectations (multi-mode category browsing with clear list/grid/expand pattern) are only partially represented.

Impact:
- Product feels like a prototype instead of a premium, intentional experience.

### E. Test and reliability coverage is low for release confidence
- Current test file is a script-style logic simulation, not integrated app-level automated test coverage.

Impact:
- Higher regression risk during backend and UX upgrades.

## 4) UX Direction to Match Your Target (Uber + Snapchat Map + Jiji + 2clicks)
### North-star interaction model
1. App opens directly into live map (default tab).
2. User sees active vendors in locality with motion-safe live updates (availability and movement if mobile vendors).
3. Bottom sheet gives instant vendor cards with distance, ETA, open state, trust badge, and quick actions.
4. Category system supports 2 modes:
   - Visual icon grid mode (2clicks style) for exploration.
   - Dense list/split mode for fast drill-down (Jiji style).
5. Search is global and map-aware:
   - query + category + distance + open-now filters
   - map viewport aware results

### Premium visual system recommendations
- Keep strong brand identity and improve hierarchy contrast.
- Introduce map-first depth: layered cards, subtle blur overlays, adaptive shadows.
- Vendor cards: image + trust + price indicator + ETA + distance + open status.
- Keep icon language consistent per category taxonomy.
- Improve motion: marker pulse for active vendors, smooth sheet snap choreography, staged content reveal.

## 5) Technical Blueprint for True Real-Time Locality Vendor Map
### Data contracts
- Source of truth tables:
  - profiles, vendors, vendor_locations, products_services, direction_requests
- Add vendor_presence table for live activity:
  - vendor_id
  - location geography(point, 4326)
  - heading, speed
  - availability_state
  - updated_at

### Event model
- Vendor app sends heartbeat every 5-10s while active.
- Backend upserts vendor_presence.
- Customer app subscribes to locality-scoped presence stream.
- Client only renders vendors inside current locality + viewport + filter set.

### Privacy and security
- Keep home-based masking in public view.
- Expose exact location only after approved direction workflow.
- Add anti-scraping controls:
  - request rate limits
  - short-lived signed response windows
  - anomaly detection for mass coordinate pulls

### Performance targets
- First map paint under 1.8s on mid Android.
- Marker update budget under 16ms frame for smooth 60fps pan.
- Marker clustering when count exceeds threshold.

## 6) Product IA and Screen Improvements
### Customer side
- Map tab first (default landing).
- Add Map/List toggle directly on discovery surface.
- Add category rail with icon and text chips synced to map markers.
- Add locality picker in top bar with confidence indicator (GPS vs manual).
- Add trust surfaces:
  - Verified vendor
  - Recently active
  - Average response time

### Category experience (using your attached inspirations)
- Mode A: Icon grid discovery board.
- Mode B: Left category rail + right subcategory list panel.
- Mode C: Sell flow category accordion with one-tap expand and continue CTA.

### Vendor side
- Replace mock pin-drop with real map pin selection and reverse geocode.
- Add live status controls:
  - Open/Closed
  - Mobile/Stationary
  - In service radius
- Add quality score checklist (profile completeness, response speed, fulfilled requests).

## 7) Phased Roadmap
### Phase 0 (1 week): Foundation correction
- Enable real Supabase client and environment strategy.
- Normalize category taxonomy and shared constants.
- Fix navigation handoff for Explore and category actions.

### Phase 1 (2-3 weeks): Real-time MVP
- Implement locality-scoped vendor fetch from backend.
- Add vendor presence heartbeat and customer realtime subscription.
- Render live map marker state updates and open/closed transitions.
- Introduce marker clustering and viewport-based query.

### Phase 2 (2 weeks): Premium UX pass
- Deliver dual-mode categories (grid + split panel).
- Upgrade vendor cards and bottom sheet micro-interactions.
- Add map/list synchronized results panel.

### Phase 3 (2 weeks): Trust, safety, and growth
- Hardening for privacy and abuse controls.
- Instrument analytics funnel and retention triggers.
- Launch A/B tests for onboarding and discovery conversions.

## 8) KPI Framework (to measure premium readiness)
- Time to first useful vendor result
- Vendor contact rate from map session
- Direction request completion rate
- Repeat sessions per user per week
- Vendor online uptime ratio
- Search-to-chat conversion
- Locality coverage depth (active vendors per category)

## 9) Immediate Priority Checklist (Next 10 days)
- Turn on Supabase client and replace mock runtime stores.
- Unify categories across Home, Explore, and vendor profiles.
- Implement locality-filtered vendor query in map flow.
- Add realtime subscription channel for vendor open/close and location updates.
- Fix navigation routes for Browse Categories and Rewards handoff.
- Replace mock vendor pin-drop setup with actual map picker.

## 10) Bottom Line
VEND has a strong concept and promising structure, but the premium claim depends on one thing: dependable real-time locality vendor visibility. Build that first, then layer premium UX polish. If you sequence delivery around this core, the app can become a standout utility product in this category.
