// Centralized configuration for vendor subscription tiers.
//
// IMPORTANT: This is the single source of truth for tier numbers, listing
// limits, and pricing copy used across the app (SubscriptionManagerScreen,
// ProductManagementScreen, AppContext, map/explore "BOOSTED" badges, etc).
//
// To add a future tier (e.g. an annual fiat plan with more perks):
//   1. Add a new entry to SUBSCRIPTION_PLANS below with the next tier number.
//   2. Update the `subscription_tier` CHECK constraint in supabase/schema.sql
//      to allow the new tier number.
//   3. Update the `check_listing_limit_before_insert` trigger in
//      supabase/schema.sql to include the new tier's maxListings.
//
// All vendor-to-customer payments remain out of scope for VEND. These tiers
// only control the vendor's own subscription to the platform (visibility,
// listing capacity, and future platform features) and are billed in NGN via
// Paystack. No crypto/Web3 payment path is supported.

export interface SubscriptionPlan {
  /** Numeric tier stored on the vendor record (matches supabase schema). */
  tier: number;
  /** Stable identifier, useful for analytics/keys. */
  id: string;
  /** Display name shown to vendors. */
  name: string;
  /** Human-readable price, shown on the plan card. */
  priceLabel: string;
  /** Maximum number of active product/service listings allowed on this tier. */
  maxListings: number;
  /** Whether vendors on this tier get the "BOOSTED" map pin + search priority. */
  boosted: boolean;
  /** Bullet list of perks shown on the plan card (data-driven, easy to extend). */
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 1,
    id: 'free',
    name: 'Free Explorer',
    priceLabel: 'FREE',
    maxListings: 2,
    boosted: false,
    features: [
      'Standard map pin listing',
      'Basic search placement',
      'Up to 2 active service/product listings',
    ],
  },
  {
    tier: 2,
    id: 'boosted',
    name: 'Premium Boosted',
    priceLabel: '₦5,000 / month',
    maxListings: 10,
    boosted: true,
    features: [
      'Pulsing boosted map pin marker',
      'Top category search placement priority',
      'Up to 10 active service/product listings',
      'Early access to new platform features',
    ],
  },
];

export const MIN_SUBSCRIPTION_TIER = SUBSCRIPTION_PLANS[0].tier;
export const MAX_SUBSCRIPTION_TIER = SUBSCRIPTION_PLANS[SUBSCRIPTION_PLANS.length - 1].tier;

/** Returns the plan config for a given tier number, falling back to the free tier. */
export const getPlanForTier = (tier: number | undefined | null): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS.find(p => p.tier === tier) ?? SUBSCRIPTION_PLANS[0];
};

/** Clamps an arbitrary tier value to a valid, supported tier number. */
export const clampTier = (tier: number): number => {
  if (SUBSCRIPTION_PLANS.some(p => p.tier === tier)) return tier;
  return MIN_SUBSCRIPTION_TIER;
};
