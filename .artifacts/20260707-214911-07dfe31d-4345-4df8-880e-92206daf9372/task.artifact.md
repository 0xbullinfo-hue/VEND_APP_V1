# Task Management: VEND Roadmap & Implementation

## Phase 0: Local Build Unblocking (Complete)
- [x] Clear corrupted Boost cache: Delete `node_modules/expo-modules-core/android/build/`
- [x] Preventative: Bump Gradle heap to 4096m in `gradle.properties`
- [x] Fix Native Config: Align NDK version and resolve "multiple Kotlin plugins" warning
- [x] Verify Reanimated: Check for Hermes/JSC mismatch on first launch

## Phase 1: Core Visibility & Safety (Complete)
- [x] **Native Infrastructure**:
    - [x] Link `react-native-vector-icons` font in `android/app/build.gradle`
    - [x] Wire Google Maps API Key via environment variable in Manifest
- [x] **Asset Guarding**: Set up directories for real branding assets
- [x] **Safety Center**: Correct SOS Beacon logic/copy to provide honest feedback
- [x] **Navigation & UX**:
    - [x] Fix `bell-off-outline` invalid icon name in `NotificationCenterScreen`
    - [x] Wire Profile menu "Terms" to the real `TermsOfServiceScreen`

## Phase 2: Structural Integrity & UX Standard (Complete)
- [x] **Quality Control**:
    - [x] Remove dead "Add First Service" button from `RegistrationSuccessScreen`
    - [x] Replace fake Alerts ("Notifications", "Support") with honest "Coming Soon" states
- [x] **Layout Stabilization**:
    - [x] Global migration: Switch all 18+ screens to `react-native-safe-area-context`
    - [x] Remove hard-coded `Platform.OS === 'android' ? 25 : 0` hacks
- [x] **Brand Identity**: Implement `expo-font` logic to actually load the "Inter" brand font
- [x] **Interaction Polish**: Add `hitSlop` to all icon-only buttons (min 48dp target)

## Phase 3: Premium Consistency & Scaling (Complete)
- [x] **Data Integrity**: Prepared `.env` for real Supabase Anon Key (JWT format)
- [x] **UI Consolidation**:
    - [x] Create shared `VCard` component for unified radius/shadow/padding
    - [x] Implement Token Consistency pass (Border colors/Backgrounds)
    - [x] Standardize `VImage` usage with local bundled placeholders
- [x] **Performance**: Convert `ChatScreen`, `ExploreScreen`, `ProductManagement` to `FlatList`
- [x] **Type Safety**: Implement `IonIconName` helper to replace unsafe `as any` casting
- [x] **Web Support**: Polished Map placeholder for Web build

---

## Phase 4: Real-time Awareness ("The Pulse") (Complete)
- [x] **Supabase Presence**:
    - [x] Implement `supabase.channel().on('presence', ...)` for active vendors
    - [x] Add pulsing green "Live Now" ring to map markers and vendor cards
- [x] **Daily Snapshot Feed**:
    - [x] Build vertical "Vibe Feed" UI on Home screen for daily vendor updates
    - [x] Implement image upload + 150 char caption logic for vendor snapshots

## Phase 5: High-Intent Proximity ("Hyperlocal Engine") (Complete)
- [x] **Native Alerts**:
    - [x] Integrate `expo-notifications` for lock-screen discovery alerts
    - [x] Implement Dwell Logic: Trigger alert only after 3 minutes within 100m of vendor
- [x] **Map Intelligence**:
    - [x] Implement Marker Clustering (`react-native-map-clustering`) for density
    - [x] Create optional "Activity Heatmap" layer to show trending local hubs

## Phase 6: Gamification ("The Loyalty Layer") (Complete)
- [x] **Shop Mayorships**:
    - [x] Implement persistent counter for verified visits per shop/user
    - [x] Add "Mayor" profile badges and map status for top contributors
- [x] **Locality Quests**:
    - [x] Build quest engine logic (e.g., "Visit 3 Food Vendors to earn 50pts")
    - [x] Add Quest tracker widget to the Rewards screen

## Phase 7: Vendor ROI ("The Intelligence Layer") (Complete)
- [x] **Analytics Dashboard**:
    - [x] Integrate `react-native-wagmi-charts` for visual data
    - [x] Build graphs for "Map Impressions" vs "Customer Actions" (ROI proof)
- [x] **Customer Interaction**:
    - [x] Implement FAQ Quick Buttons in chat (e.g., "Hours?", "Location?")
    - [x] Create automated "Away Message" for vendors when offline
