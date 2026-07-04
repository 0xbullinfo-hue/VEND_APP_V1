/**
 * Vendor Ranking Transparency Explainer
 *
 * Provides human-readable explanations for why vendors appear in a certain order
 * on the customer Explore screen. Promotes fairness and trust.
 */

export interface VendorRankExplanation {
  reason: string;
  factor: string;
  boost?: boolean;
  rating?: boolean;
  open?: boolean;
}

export interface RankingPolicyExplainer {
  title: string;
  summary: string;
  factors: string[];
  boostInfo: string;
}

const RANKING_POLICY: RankingPolicyExplainer = {
  title: 'How Vendors Appear Here',
  summary: 'Vendors are ranked to help you find the best match. Here\'s how we order them:',
  factors: [
    '1. Premium Boosted vendors rank above Standard vendors (when they opt-in to paid visibility)',
    '2. Open stores rank above closed ones',
    '3. Higher-rated vendors rank above lower-rated ones',
    '4. Alphabetical order breaks remaining ties',
  ],
  boostInfo:
    'Vendors can upgrade to Premium Boosted (via in-app, in NGN) to rank higher for a set period. This helps small businesses compete fairly.',
};

/**
 * Returns a human-readable explanation for why a vendor ranks in a certain position.
 */
export const explainVendorRank = (
  vendor: {
    id: string;
    business_name: string;
    subscription_tier: number;
    is_open: boolean;
    rating: number;
  },
  allVendors: {
    id: string;
    business_name: string;
    subscription_tier: number;
    is_open: boolean;
    rating: number;
  }[]
): VendorRankExplanation => {
  const isBoosted = vendor.subscription_tier > 1;
  const isOpen = vendor.is_open;

  const reasons: string[] = [];
  const factors: string[] = [];

  if (isBoosted) {
    reasons.push(`${vendor.business_name} has Premium Boosted visibility`);
    factors.push('Premium Boost');
  }

  if (isOpen) {
    reasons.push(`${vendor.business_name} is currently open`);
    factors.push('Open Now');
  } else {
    reasons.push(`${vendor.business_name} is currently closed (will rank lower)`);
    factors.push('Closed');
  }

  if (vendor.rating >= 4.5) {
    reasons.push(`Highly rated at ${vendor.rating} ⭐`);
    factors.push(`${vendor.rating}⭐ Rating`);
  } else if (vendor.rating >= 3.5) {
    reasons.push(`Good rating at ${vendor.rating} ⭐`);
    factors.push(`${vendor.rating}⭐ Rating`);
  }

  const countBoosted = allVendors.filter((v) => v.subscription_tier > 1).length;
  if (countBoosted > 0 && !isBoosted) {
    reasons.push(`${countBoosted} boosted vendor${countBoosted === 1 ? '' : 's'} rank above standard vendors`);
  }

  return {
    reason: reasons.join('; '),
    factor: factors.join(', '),
    boost: isBoosted,
    rating: vendor.rating >= 3.5,
    open: isOpen,
  };
};

/**
 * Get the ranking policy text (for modal display).
 */
export const getRankingPolicy = (): RankingPolicyExplainer => {
  return RANKING_POLICY;
};

/**
 * Compute a transparency score (0-100) based on how "fair" the ranking is
 * for a given vendor in their locality. Higher = more transparent/fair.
 */
export const getTransparencyScore = (
  vendor: { subscription_tier: number; is_open: boolean; rating: number },
  localityVendors: { subscription_tier: number; is_open: boolean; rating: number }[]
): number => {
  let score = 50; // baseline

  // Boost: if vendor is boosted, they get a transparency bump (they paid for it)
  if (vendor.subscription_tier > 1) {
    score += 20;
  }

  // Open status: if vendor is open, they get a bump
  if (vendor.is_open) {
    score += 15;
  }

  // Rating fairness: if vendor's rating is competitive, score is higher
  const avgRating = localityVendors.reduce((sum, v) => sum + v.rating, 0) / localityVendors.length;
  if (vendor.rating >= avgRating - 0.2) {
    score += 15;
  }

  return Math.min(100, score);
};
