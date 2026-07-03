# VEND Testing and Review Playbook
Date: 2026-07-02
Scope: Local developer validation for premium UX and real-time locality behavior.

## 1) Quick Test Commands
Run from project root:

```bash
npm run ts:check
npm run test:logic
npm run test:review
```

Expected:
- `npm run ts:check` exits cleanly.
- `npm run test:logic` prints all success checks in the verification suite.
- `npm run test:review` runs both checks in sequence and passes.

## 2) Preview with Expo
Use this fast preview flow during development:

1. Start the Expo dev server:
  - `npm run expo:start`
2. Open the app on Android emulator directly:
  - `npm run expo:android`
3. Optional browser preview:
  - `npm run expo:web`

If the bundler acts stale, clear cache with:
- `npx expo start -c`

## 3) Manual Premium UX Review Checklist
Use this checklist before pushing release-level changes.

### A. Navigation and IA
- App launches into customer map surface without dead routes.
- Browse Categories handoff opens customer Explore flow.
- Rewards handoff opens rewards flow directly.

### B. Home Map and Data Source Status
- Status bar indicates one of:
  - `Live locality feed connected`
  - `Using local demo dataset`
  - `Refreshing nearby vendors...`
- Vendor count in status bar updates as filters/locality change.

### C. Explore UX Quality
- Grid mode loads category cards with expected icons.
- Split mode supports category drilldown and stable vendor list rendering.
- Category selection between Home and Explore is consistent.

### D. Vendor Trust Signals
- Vendor cards show coherent open/closed state.
- Locality-scoped vendor results look correct for selected locality.

## 4) Real-Time Locality Validation (Supabase On)
Precondition:
- Set real values for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Ensure backend rows exist in locality and vendor tables.

Steps:
1. Start app and enter customer map/home.
2. Confirm status reads `Live locality feed connected`.
3. Update a vendor in Supabase (open state/location) for the current locality.
4. Confirm app refreshes vendor UI without app restart.
5. Switch locality in app.
6. Confirm vendor list/map refreshes to the new locality.

Pass criteria:
- Live status remains connected when config is valid.
- Vendor changes are reflected in UI after realtime events.
- Locality switch triggers new locality dataset.

## 5) Fallback Validation (Supabase Off)
Steps:
1. Run app without real Supabase env values.
2. Confirm status reads `Using local demo dataset`.
3. Confirm Home and Explore still render vendors and categories.

Pass criteria:
- App is fully usable in mock mode.
- No crash or blank list when backend config is missing.

## 6) Release Gate
Minimum gate to merge:
- `npm run test:review` passes.
- Manual checklist sections 3A-3D pass.
- One realtime validation pass (Section 4) recorded by QA/dev.
- One fallback validation pass (Section 5) recorded by QA/dev.
