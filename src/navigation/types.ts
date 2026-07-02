/**
 * Navigation Type Definitions
 *
 * Central source of truth for all screen names and their route parameters.
 * Import these types in navigators and screens that use useNavigation() or
 * route.params to ensure full type safety.
 */

// ─── Onboarding Stack ────────────────────────────────────────────────────────
export type OnboardingStackParamList = {
  Welcome: undefined;
  Walkthrough: undefined;
  Auth: undefined;
  Referral: undefined;
  Locality: undefined;
  OnboardingComplete: undefined;
};

// ─── Customer Stack (wraps tabs + full-screen overlays) ──────────────────────
export type CustomerStackParamList = {
  CustomerTabs: undefined;
  VendorProfile: { vendorId: string };
  DirectionRequest: { vendorId: string };
  LiveTrip: undefined;
  QRScanner: { vendorId: string };
  LeaveReview: { vendorId: string };
  Chat: { recipientId: string };
  PointsHistory: undefined;
};

// ─── Customer Tab Bar ─────────────────────────────────────────────────────────
export type CustomerTabParamList = {
  Vendors: undefined;
  Explore: undefined;
  Rewards: undefined;
  Profile: undefined;
};

// ─── Vendor Stack (wraps tabs + full-screen overlays) ────────────────────────
export type VendorStackParamList = {
  VendorTabs: undefined;
  SubscriptionManager: undefined;
  LocationSetup: undefined;
  RegistrationSuccess: undefined;
};

// ─── Vendor Tab Bar ───────────────────────────────────────────────────────────
export type VendorTabParamList = {
  Dashboard: undefined;
  Services: undefined;
  Growth: undefined;
  VendorProfile: undefined;
};

// ─── Root Stack ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding: undefined;
  CustomerApp: undefined;
  VendorApp: undefined;
};
