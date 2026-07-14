import { rankVendorsForCustomer } from './vendorRanking';
import { VendorProfile } from '../types';

export type RankUpNudgeType = 'upgrade' | 'rating_gap' | 'already_top' | 'open_status';

export interface RankUpNudge {
  type: RankUpNudgeType;
  message: string;
  subMessage: string;
  value: number; // rating gap, number of boosted vendors, or 0
  urgent: boolean; // true when the gap is very small (actionable today)
  actionLabel: string;
}

const RATING_URGENT_THRESHOLD = 0.3;
const RATING_NEAR_THRESHOLD = 0.8;

/**
 * Returns the nearest rank-up nudge for a given vendor in a locality.
 * Uses the V2 Master Plan AI Ranking utility.
 */
export const computeRankUpNudge = (
  vendor: VendorProfile,
  localityVendors: VendorProfile[]
): RankUpNudge => {
  // Sort all vendors by the new V2 AI relevance algorithm
  const ranked = rankVendorsForCustomer(localityVendors);

  const currentRank = ranked.findIndex((v) => v.id === vendor.id);
  if (currentRank <= 0) {
    // Already #1 or not found
    return {
      type: 'already_top',
      message: "You're #1 in your locality!",
      subMessage: 'Keep up the great work to maintain your top position.',
      value: 0,
      urgent: false,
      actionLabel: 'View Growth Hub',
    };
  }

  const nextAbove = ranked[currentRank - 1];

  // Case 1: Vendor is not boosted but next competitor is → upgrade nudge
  if (vendor.subscription_tier === 1 && nextAbove.subscription_tier > 1) {
    const boostedCount = ranked.filter((v) => v.subscription_tier > 1).length;
    return {
      type: 'upgrade',
      message: `Skip past ${boostedCount} boosted vendor${boostedCount === 1 ? '' : 's'}`,
      subMessage: 'Upgrade to Premium Boosted to rank above all standard listings instantly.',
      value: boostedCount,
      urgent: true,
      actionLabel: 'Upgrade Plan',
    };
  }

  // Case 2: Vendor is closed, next competitor is open (same tier)
  if (!vendor.is_open && nextAbove.is_open && vendor.subscription_tier === nextAbove.subscription_tier) {
    return {
      type: 'open_status',
      message: 'Mark your store open to rank up',
      subMessage: "Your store is currently closed. Open vendors rank above closed ones in customer discovery.",
      value: 0,
      urgent: true,
      actionLabel: 'Go Live Now',
    };
  }

  // Case 3: Same tier + same open status — rating gap
  if (vendor.subscription_tier === nextAbove.subscription_tier && vendor.is_open === nextAbove.is_open) {
    const ratingGap = parseFloat((nextAbove.rating - vendor.rating).toFixed(1));
    const isUrgent = ratingGap > 0 && ratingGap <= RATING_URGENT_THRESHOLD;
    const isNear = ratingGap > 0 && ratingGap <= RATING_NEAR_THRESHOLD;

    if (isNear) {
      return {
        type: 'rating_gap',
        message: `${ratingGap > 0 ? '+' : ''}${ratingGap} rating to rank up`,
        subMessage: `You're ${ratingGap} stars behind ${nextAbove.business_name}. Earn more reviews to close the gap.`,
        value: ratingGap,
        urgent: isUrgent,
        actionLabel: 'Request Reviews',
      };
    }
  }

  // Default: generic encouragement
  return {
    type: 'rating_gap',
    message: `Rank #${currentRank + 1} — keep building momentum`,
    subMessage: 'Get more profile views, directions, and chat interactions to improve your discovery rank.',
    value: 0,
    urgent: false,
    actionLabel: 'View Growth Hub',
  };
};
