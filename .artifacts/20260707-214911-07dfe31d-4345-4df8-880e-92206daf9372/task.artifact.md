# Task Management: VEND Premium Implementation Plan

## Phase 0: Local Build Unblocking (Immediate Environment Fixes)
- [x] Clear corrupted Boost cache: Delete `node_modules/expo-modules-core/android/build/` (#18)
- [x] Preventative: Bump Gradle heap to 4096m in `gradle.properties` (#21)
- [x] Fix Native Config: Align NDK version and resolve "multiple Kotlin plugins" warning (#19)
- [x] Verify Reanimated: Check for Hermes/JSC mismatch on first launch (#20)

## Phase 1: Core Visibility & Safety (The "Look and Trust" Layer)
- [x] **Native Infrastructure**:
    - [x] Link `react-native-vector-icons` font in `android/app/build.gradle` (#2)
    - [x] Wire Google Maps API Key via environment variable in Manifest (#4)
- [x] **Asset Guarding**: Set up directories for real branding assets (#1)
- [x] **Safety Center**: Correct SOS Beacon logic/copy to provide honest distressed feedback (#5)
- [x] **Navigation & UX**:
    - [x] Fix `bell-off-outline` invalid icon name in `NotificationCenterScreen` (#3)
    - [x] Wire Profile menu "Terms" to the real `TermsOfServiceScreen` (#7)

## Phase 2: Structural Integrity & UX Standard (The "Engine & Feel" Layer)
- [x] **Quality Control**:
    - [x] Remove dead "Add First Service" button from `RegistrationSuccessScreen` (#6)
    - [x] Replace fake Alerts ("Notifications", "Support") with honest "Coming Soon" states (#7)
- [x] **Layout Stabilization**:
    - [x] Global migration: Switch all 18+ screens to `react-native-safe-area-context` (#14)
    - [x] Remove hard-coded `Platform.OS === 'android' ? 25 : 0` hacks (#14)
- [x] **Brand Identity**: Implement `expo-font` logic to actually load the "Inter" brand font (#13)
- [x] **Interaction Polish**: Add `hitSlop` to all icon-only buttons (min 48dp target) (#15)

## Phase 3: Premium Consistency & Scaling (The "Polish & Production" Layer)
- [x] **Data Integrity**: Prepared `.env` for real Supabase Anon Key (JWT format) (#8)
- [x] **UI Consolidation**:
    - [x] Create shared `VCard` component for unified radius/shadow/padding (#10)
    - [x] Implement Token Consistency pass (Border colors/Backgrounds) (#16)
    - [x] Standardize `VImage` usage with local bundled placeholders (#11)
- [x] **Performance**: Convert `ChatScreen`, `ExploreScreen`, `ProductManagement` to `FlatList` (#17)
- [x] **Type Safety**: Implement `IonIconName` helper to replace unsafe `as any` casting (#12)
- [x] **Web Support**: Polished Map placeholder for Web build (#9)

## Final Verification
- [x] TypeScript Check: Clean `tsc` compilation with zero errors.
- [x] Logic Verification: Checked navigation flows and SOS feedback.
- [x] Component Standardization: Confirmed `VImage` and `VCard` usage.
