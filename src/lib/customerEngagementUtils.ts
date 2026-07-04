import {
  BrowsingEvent,
  CustomerPreference,
  VendorInteractionHistory,
} from '../store/useCustomerEngagementStore';

/**
 * Customer Engagement Analytics Utilities
 */

export interface PersonalizedRecommendation {
  vendorId: string;
  vendorName: string;
  category: string;
  reason: string; // Why recommended
  relevanceScore: number; // 0-100
  estimatedInterestLevel: 'high' | 'medium' | 'low';
}

export interface BrowsingPattern {
  averageSessionDuration: number; // minutes
  browsingFrequency: 'daily' | 'weekly' | 'occasional'; // based on last 7 days
  preferredTimeOfDay: string; // morning, afternoon, evening, night
  averageBrowsingHour: number; // 0-23
  mostViewedCategory: string;
  categoryDiversity: number; // 0-100, how varied their interests are
}

export interface CustomerEngagementInsight {
  title: string;
  description: string;
  type: 'positive' | 'insight' | 'suggestion';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate browsing patterns from engagement history
 */
export function analyzeBrowsingPatterns(
  browsingHistory: BrowsingEvent[],
  windowDays = 7
): BrowsingPattern {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const recentEvents = browsingHistory.filter((e) => e.timestamp > now - windowMs);

  if (recentEvents.length === 0) {
    return {
      averageSessionDuration: 0,
      browsingFrequency: 'occasional',
      preferredTimeOfDay: 'afternoon',
      averageBrowsingHour: 14,
      mostViewedCategory: 'unknown',
      categoryDiversity: 0,
    };
  }

  // Calculate average session duration (using consecutive events within 15 min as same session)
  let sessionCount = 1;
  let totalSessionDuration = 0;
  let lastTimestamp = recentEvents[0].timestamp;

  for (let i = 1; i < recentEvents.length; i++) {
    const timeDiff = recentEvents[i].timestamp - recentEvents[i - 1].timestamp;
    if (timeDiff > 15 * 60 * 1000) {
      // New session if >15 min gap
      sessionCount += 1;
    }
  }

  totalSessionDuration = recentEvents.reduce((sum, e) => sum + e.durationSeconds, 0) / 60; // to minutes
  const averageSessionDuration = totalSessionDuration / Math.max(1, sessionCount);

  // Browsing frequency
  const daysActive = new Set(recentEvents.map((e) => new Date(e.timestamp).toDateString())).size;
  let browsingFrequency: 'daily' | 'weekly' | 'occasional' = 'occasional';
  if (daysActive >= 5) {
    browsingFrequency = 'daily';
  } else if (daysActive >= 2) {
    browsingFrequency = 'weekly';
  }

  // Preferred time of day
  const hourCounts = new Map<number, number>();
  recentEvents.forEach((e) => {
    const hour = new Date(e.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  const avgHour = Math.round(
    Array.from(hourCounts.entries()).reduce((sum, [hour, count]) => sum + hour * count, 0) /
      recentEvents.length
  );

  let preferredTimeOfDay = 'afternoon';
  if (avgHour < 12) {
    preferredTimeOfDay = 'morning';
  } else if (avgHour < 17) {
    preferredTimeOfDay = 'afternoon';
  } else if (avgHour < 21) {
    preferredTimeOfDay = 'evening';
  } else {
    preferredTimeOfDay = 'night';
  }

  // Most viewed category
  const categoryMap = new Map<string, number>();
  recentEvents.forEach((e) => {
    const cat = e.category || 'uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const mostViewedCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  // Category diversity (entropy-like calculation)
  const categoryDiversity = Math.min(100, categoryMap.size * 15); // More categories = more diverse

  return {
    averageSessionDuration: Math.round(averageSessionDuration * 10) / 10,
    browsingFrequency,
    preferredTimeOfDay,
    averageBrowsingHour: avgHour,
    mostViewedCategory,
    categoryDiversity,
  };
}

/**
 * Find customer interest gaps (categories they don't browse but might like)
 */
export function identifyInterestGaps(
  categoryPreferences: CustomerPreference[],
  allAvailableCategories: string[]
): string[] {
  const preferredCategories = new Set(categoryPreferences.map((p) => p.categoryId));
  return allAvailableCategories.filter((cat) => !preferredCategories.has(cat));
}

/**
 * Generate personalized vendor recommendations based on browsing patterns
 */
export function generatePersonalizedRecommendations(
  categoryPreferences: CustomerPreference[],
  vendorInteractionHistory: Map<string, VendorInteractionHistory>,
  allVendorsInPreferredCategories: Array<{ id: string; name: string; category: string; rating?: number }>
): PersonalizedRecommendation[] {
  if (categoryPreferences.length === 0 || allVendorsInPreferredCategories.length === 0) {
    return [];
  }

  // Get top 3 preferred categories
  const topCategories = categoryPreferences.slice(0, 3).map((p) => p.categoryId);

  // Score vendors
  const recommendations = allVendorsInPreferredCategories
    .filter((v) => topCategories.includes(v.category))
    .map((vendor) => {
      const history = vendorInteractionHistory.get(vendor.id);
      const isNewVendor = !history || history.viewCount === 0;
      const hasBeenViewed = history && history.viewCount > 0;

      // Relevance score factors
      let score = 50; // base score

      // Factor 1: Category match
      const categoryIndex = topCategories.indexOf(vendor.category);
      score += Math.max(0, 30 - categoryIndex * 10); // Top category gets more points

      // Factor 2: Rating boost
      if (vendor.rating) {
        score += Math.min(15, vendor.rating * 3);
      }

      // Factor 3: Freshness penalty (penalize if viewed recently to avoid repetition)
      if (hasBeenViewed && history) {
        const daysSinceView = (Date.now() - history.lastViewTime) / (1000 * 60 * 60 * 24);
        if (daysSinceView < 1) {
          score -= 20; // Recently viewed, deprioritize
        }
      }

      // Factor 4: New vendor bonus
      if (isNewVendor) {
        score += 10;
      }

      const categoryPref = categoryPreferences.find((p) => p.categoryId === vendor.category);
      const reason = isNewVendor
        ? `New vendor in your favorite category: ${vendor.category}`
        : `Popular in ${vendor.category} category`;

      const estimatedInterestLevel: 'high' | 'medium' | 'low' = score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low';

      return {
        vendorId: vendor.id,
        vendorName: vendor.name,
        category: vendor.category,
        reason,
        relevanceScore: Math.min(100, score),
        estimatedInterestLevel,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5); // Top 5 recommendations

  return recommendations;
}

/**
 * Calculate similarity between two vendor interaction profiles
 */
export function calculateVendorSimilarity(
  vendorA: VendorInteractionHistory,
  vendorB: VendorInteractionHistory
): number {
  const viewSimilarity = Math.min(1, Math.min(vendorA.viewCount, vendorB.viewCount) / Math.max(1, Math.max(vendorA.viewCount, vendorB.viewCount)));
  const favoriteSimilarity = vendorA.favoriteCount > 0 && vendorB.favoriteCount > 0 ? 0.5 : 0;
  const interactionTimeSimilarity = Math.min(1, Math.min(vendorA.totalInteractionTime, vendorB.totalInteractionTime) / Math.max(1, Math.max(vendorA.totalInteractionTime, vendorB.totalInteractionTime)));

  return (viewSimilarity + favoriteSimilarity + interactionTimeSimilarity) / 3;
}

/**
 * Find similar vendors (for "you might also like" recommendations)
 */
export function findSimilarVendors(
  targetVendorId: string,
  vendorInteractionHistory: Map<string, VendorInteractionHistory>,
  topN = 3
): string[] {
  const targetVendor = vendorInteractionHistory.get(targetVendorId);
  if (!targetVendor) {
    return [];
  }

  const similarities = Array.from(vendorInteractionHistory.entries())
    .filter(([id]) => id !== targetVendorId)
    .map(([id, vendor]) => ({
      vendorId: id,
      similarity: calculateVendorSimilarity(targetVendor, vendor),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN)
    .map((s) => s.vendorId);

  return similarities;
}

/**
 * Generate customer engagement insights and suggestions
 */
export function generateEngagementInsights(
  browsingPattern: BrowsingPattern,
  categoryPreferences: CustomerPreference[],
  vendorInteractionHistory: Map<string, VendorInteractionHistory>,
  engagementScore: number
): CustomerEngagementInsight[] {
  const insights: CustomerEngagementInsight[] = [];

  // Insight 1: Browsing frequency
  if (browsingPattern.browsingFrequency === 'daily') {
    insights.push({
      title: 'You\'re a Power Shopper! 🔥',
      description: 'You browse daily. Consider enabling notifications to stay updated on your favorite vendors.',
      type: 'positive',
      priority: 'medium',
    });
  } else if (browsingPattern.browsingFrequency === 'occasional') {
    insights.push({
      title: 'Explore More Vendors',
      description: `You browse ${browsingPattern.browsingFrequency}. Check out new vendors in your favorite categories to discover hidden gems.`,
      type: 'suggestion',
      priority: 'low',
    });
  }

  // Insight 2: Preferred time
  if (browsingPattern.preferredTimeOfDay === 'night') {
    insights.push({
      title: 'Night Owl Alert 🌙',
      description: 'You browse mostly in the evening. Enable quiet notifications to avoid disruptions.',
      type: 'insight',
      priority: 'low',
    });
  }

  // Insight 3: Category diversity
  if (browsingPattern.categoryDiversity < 20) {
    insights.push({
      title: 'Expand Your Interests',
      description: `You mostly browse "${browsingPattern.mostViewedCategory}". Try exploring adjacent categories for fresh discoveries.`,
      type: 'suggestion',
      priority: 'medium',
    });
  } else if (browsingPattern.categoryDiversity >= 60) {
    insights.push({
      title: 'Diverse Explorer 🌟',
      description: 'You explore many categories. Your personalized recommendations will be highly tailored.',
      type: 'positive',
      priority: 'low',
    });
  }

  // Insight 4: Engagement level
  if (engagementScore >= 80) {
    insights.push({
      title: 'Super Engaged Customer',
      description: 'Your engagement is exceptional. You\'ll get priority access to new vendors and exclusive deals.',
      type: 'positive',
      priority: 'low',
    });
  } else if (engagementScore < 30) {
    insights.push({
      title: 'Personalized for You',
      description: 'Start exploring vendors in your favorite categories. We\'ll learn your preferences over time.',
      type: 'suggestion',
      priority: 'high',
    });
  }

  // Insight 5: Conversation starter
  const conversationStarters = Array.from(vendorInteractionHistory.values()).filter((h) => h.conversationStarted);
  if (conversationStarters.length === 0 && vendorInteractionHistory.size > 3) {
    insights.push({
      title: 'Ready to Connect?',
      description: 'You\'ve viewed several vendors. Start a conversation with one to get personalized service.',
      type: 'suggestion',
      priority: 'medium',
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Predict customer churn risk based on engagement decline
 */
export function predictEngagementTrend(
  browsingHistory: BrowsingEvent[],
  windowDays = 7
): 'increasing' | 'stable' | 'declining' {
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const halfWindow = windowMs / 2;

  const firstHalf = browsingHistory.filter((e) => e.timestamp > now - windowMs && e.timestamp <= now - halfWindow);
  const secondHalf = browsingHistory.filter((e) => e.timestamp > now - halfWindow);

  if (firstHalf.length === 0) return 'stable';

  const trend = secondHalf.length / firstHalf.length;
  if (trend > 1.2) return 'increasing';
  if (trend < 0.8) return 'declining';
  return 'stable';
}
