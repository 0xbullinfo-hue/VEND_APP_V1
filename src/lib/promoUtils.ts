import { Promotion, PromoUsage, VendorPromoStats } from '../store/usePromoStore';

/**
 * Calculate effectiveness score for a promotion (0-100)
 */
export function calculatePromoEffectiveness(stats: VendorPromoStats, totalPromos: number): number {
  if (totalPromos === 0) return 0;

  // Components:
  // - Redemption rate (0-40): Higher redemptions = better
  // - Customer reach (0-30): More unique customers = better
  // - Revenue generation (0-30): More discount given = better (paradoxically, high discount usage means promo is working)

  const redemptionScore = Math.min(40, (stats.totalRedemptions / Math.max(1, totalPromos * 10)) * 40);
  const reachScore = Math.min(30, (stats.uniqueCustomersReached / Math.max(1, totalPromos * 5)) * 30);
  const revenueScore = Math.min(30, (stats.totalDiscountGiven / Math.max(1, totalPromos * 2000)) * 30); // Assume ~2000 per promo is healthy

  return Math.round(redemptionScore + reachScore + revenueScore);
}

/**
 * Analyze redemption rate (% of customers who view vs use promo)
 */
export function analyzeRedemptionRate(stats: VendorPromoStats): {
  rate: number; // 0-100
  trend: 'strong' | 'moderate' | 'weak';
  recommendation: string;
} {
  const rate = stats.totalPromos > 0 ? (stats.conversionRate / stats.totalPromos) * 100 : 0;

  let trend: 'strong' | 'moderate' | 'weak' = 'weak';
  let recommendation = '';

  if (rate >= 40) {
    trend = 'strong';
    recommendation = 'Excellent redemption rate. Consider scaling budget.';
  } else if (rate >= 20) {
    trend = 'moderate';
    recommendation = 'Decent redemption rate. Experiment with discount timing.';
  } else {
    trend = 'weak';
    recommendation = 'Low redemption. Review promo terms, timing, and visibility.';
  }

  return {
    rate: Math.round(rate * 10) / 10,
    trend,
    recommendation,
  };
}

/**
 * Segment customers by engagement level for targeted promos
 */
export function segmentCustomersForPromo(usageHistory: PromoUsage[]): {
  whales: string[]; // Top spenders
  loyals: string[]; // Frequent users
  dormant: string[]; // Not used recently
  oneTimeOnly: string[]; // Single purchase
} {
  const customerUsage = new Map<string, { count: number; lastUsedAt: number; totalSpent: number }>();

  usageHistory.forEach((usage) => {
    const existing = customerUsage.get(usage.customerId) || { count: 0, lastUsedAt: 0, totalSpent: 0 };
    customerUsage.set(usage.customerId, {
      count: existing.count + 1,
      lastUsedAt: Math.max(existing.lastUsedAt, usage.usedAt),
      totalSpent: existing.totalSpent + usage.discountApplied,
    });
  });

  const whales: string[] = [];
  const loyals: string[] = [];
  const dormant: string[] = [];
  const oneTimeOnly: string[] = [];

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  customerUsage.forEach((stats, customerId) => {
    if (stats.count === 1) {
      oneTimeOnly.push(customerId);
    } else if (stats.lastUsedAt < thirtyDaysAgo) {
      dormant.push(customerId);
    } else if (stats.totalSpent > 5000) {
      whales.push(customerId);
    } else if (stats.count >= 3) {
      loyals.push(customerId);
    }
  });

  return { whales, loyals, dormant, oneTimeOnly };
}

/**
 * Recommend optimal promo timing based on historical patterns
 */
export function recommendPromoTiming(usageHistory: PromoUsage[]): {
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  seasonalTrend: 'rising' | 'falling' | 'stable';
  estimatedPeakPeriod: string;
} {
  if (usageHistory.length === 0) {
    return {
      bestDayOfWeek: 'Friday',
      bestTimeOfDay: '6PM-9PM',
      seasonalTrend: 'stable',
      estimatedPeakPeriod: 'Weekend',
    };
  }

  // Day of week analysis
  const dayCount = new Map<number, number>();
  const hourCount = new Map<number, number>();

  usageHistory.forEach((usage) => {
    const date = new Date(usage.usedAt);
    const day = date.getDay(); // 0=Sunday, 6=Saturday
    const hour = date.getHours();

    dayCount.set(day, (dayCount.get(day) || 0) + 1);
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
  });

  // Find best day
  let bestDay = 5; // Default Friday
  let maxDayCount = 0;
  dayCount.forEach((count, day) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      bestDay = day;
    }
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const bestDayOfWeek = dayNames[bestDay];

  // Find best hour
  let bestHour = 18; // Default 6PM
  let maxHourCount = 0;
  hourCount.forEach((count, hour) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      bestHour = hour;
    }
  });

  const bestTimeOfDay = `${bestHour}:00-${bestHour + 1}:00`;

  // Seasonal trend (compare first half vs second half of month)
  const midDate = Date.now() - 15 * 24 * 60 * 60 * 1000;
  const firstHalf = usageHistory.filter((u) => u.usedAt < midDate).length;
  const secondHalf = usageHistory.filter((u) => u.usedAt >= midDate).length;

  let seasonalTrend: 'rising' | 'falling' | 'stable' = 'stable';
  if (secondHalf > firstHalf * 1.2) {
    seasonalTrend = 'rising';
  } else if (firstHalf > secondHalf * 1.2) {
    seasonalTrend = 'falling';
  }

  return {
    bestDayOfWeek,
    bestTimeOfDay,
    seasonalTrend,
    estimatedPeakPeriod: [5, 6].includes(bestDay) ? 'Weekend' : 'Weekday',
  };
}

/**
 * Calculate ROI for a promotion
 */
export function calculatePromoROI(promo: Promotion, stats: VendorPromoStats): {
  roi: number; // %
  paybackPeriod: number; // Days
  breakeven: boolean;
  recommendation: string;
} {
  // Estimate cost of discount (sum of all discounts given)
  const discountCost = stats.totalDiscountGiven;

  // Estimate incremental revenue (assume 30% of discounted orders are incremental)
  const incrementalOrders = stats.totalRedemptions * 0.3;
  const avgOrderValue = 5000; // NGN
  const incrementalRevenue = incrementalOrders * avgOrderValue;

  // Gross margin assumption: 30%
  const grossMargin = incrementalRevenue * 0.3;

  const roi = discountCost > 0 ? ((grossMargin - discountCost) / discountCost) * 100 : 0;

  // Payback period: How many days to recover discount cost
  const daysActive = (promo.endDate - promo.startDate) / (24 * 60 * 60 * 1000);
  const dailyRevenue = grossMargin / Math.max(1, daysActive);
  const paybackPeriod = dailyRevenue > 0 ? Math.ceil(discountCost / dailyRevenue) : daysActive;

  const breakeven = roi >= 0;

  let recommendation = '';
  if (roi >= 100) {
    recommendation = 'Excellent ROI. Consider increasing discount budget.';
  } else if (roi >= 0) {
    recommendation = 'Positive ROI. Continue with current strategy.';
  } else if (roi >= -50) {
    recommendation = 'Negative ROI. Review targeting and discount value.';
  } else {
    recommendation = 'Poor ROI. Consider ending this promotion.';
  }

  return {
    roi: Math.round(roi),
    paybackPeriod: Math.max(1, paybackPeriod),
    breakeven,
    recommendation,
  };
}

/**
 * Detect promo fatigue (customer seeing too many promos)
 */
export function detectPromoFatigue(usageHistory: PromoUsage[], customerId: string): {
  fatigueLevel: 'low' | 'medium' | 'high';
  usageFrequency: number; // Uses per day
  recommendation: string;
} {
  const customerUsage = usageHistory.filter((u) => u.customerId === customerId);

  if (customerUsage.length === 0) {
    return {
      fatigueLevel: 'low',
      usageFrequency: 0,
      recommendation: 'No promo usage yet. Safe to show promos.',
    };
  }

  // Calculate usage frequency over past 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentUsage = customerUsage.filter((u) => u.usedAt >= thirtyDaysAgo);
  const usageFrequency = recentUsage.length / 30; // Uses per day

  let fatigueLevel: 'low' | 'medium' | 'high' = 'low';
  let recommendation = '';

  if (usageFrequency >= 0.5) {
    // More than every other day
    fatigueLevel = 'high';
    recommendation = 'Customer using promos very frequently. Reduce promo frequency to prevent discount dependency.';
  } else if (usageFrequency >= 0.2) {
    fatigueLevel = 'medium';
    recommendation = 'Moderate promo usage. Mix with loyalty rewards instead.';
  } else {
    fatigueLevel = 'low';
    recommendation = 'Low promo usage. Safe to continue.';
  }

  return {
    fatigueLevel,
    usageFrequency: Math.round(usageFrequency * 100) / 100,
    recommendation,
  };
}

/**
 * Generate actionable promo insights
 */
export function generatePromoInsights(
  stats: VendorPromoStats,
  usageHistory: PromoUsage[],
  allPromos: Promotion[]
): string[] {
  const insights: string[] = [];

  // Insight 1: High performer
  if (stats.totalRedemptions > 50) {
    insights.push(`🎯 Star Performer: ${stats.totalRedemptions} redemptions. Your promos are resonating well.`);
  }

  // Insight 2: Wide reach
  if (stats.uniqueCustomersReached > 30) {
    insights.push(`📊 Wide Reach: ${stats.uniqueCustomersReached} unique customers engaged. Excellent promo visibility.`);
  }

  // Insight 3: Discount optimization
  const avgDiscount = stats.averageDiscountPerRedemption;
  if (avgDiscount > 2000) {
    insights.push(`💰 High Discount Average: ₦${avgDiscount.toFixed(0)} per use. Consider reducing to improve margins.`);
  } else if (avgDiscount < 500) {
    insights.push(`🎁 Low Discount Value: ₦${avgDiscount.toFixed(0)} per use. Consider increasing to boost adoption.`);
  }

  // Insight 4: Seasonal trend
  const firstHalf = usageHistory.filter((u) => u.usedAt < Date.now() - 15 * 24 * 60 * 60 * 1000).length;
  const secondHalf = usageHistory.filter((u) => u.usedAt >= Date.now() - 15 * 24 * 60 * 60 * 1000).length;
  if (secondHalf > firstHalf * 1.5) {
    insights.push(`📈 Trending Up: Recent usage up 50% vs earlier period. Momentum is strong.`);
  }

  // Insight 5: Few promos
  if (stats.totalPromos < 3) {
    insights.push(`📢 Limited Promos: Only ${stats.totalPromos} active. Consider creating more to boost engagement.`);
  }

  // Insight 6: One-time users risk
  const { oneTimeOnly } = segmentCustomersForPromo(usageHistory);
  if (oneTimeOnly.length > stats.uniqueCustomersReached * 0.3) {
    insights.push(`⚠️ Retention Risk: ${oneTimeOnly.length} one-time users. Create loyalty promos to drive repeat.`);
  }

  return insights;
}
