import { AnalyticsEventRecord } from './analyticsDataProvider';

export interface EngagementMetrics {
  totalInteractions: number;
  profileViews: number;
  directionRequests: number;
  chatStarts: number;
  engagementRate: number; // interactions per unique day
  averageInteractionsPerDay: number;
  engagementTrend: 'increasing' | 'stable' | 'declining';
  engagementScore: number; // 0-100 weighted score
  engagementLabel: 'high' | 'medium' | 'low';
}

export interface GrowthMetrics extends EngagementMetrics {
  growthDelta: number; // % change vs previous period
  weekOverWeekGrowth: number; // % growth this week vs last
  estimatedRankMovement: number; // estimated rank change
  conversionRate: number; // chats / profile views
  customerRetention: number; // repeat customers %
  peakEngagementHour: number; // 0-23
  peakEngagementDay: string; // 'Mon', 'Tue', etc
}

export interface GrowthRecommendation {
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'engagement' | 'conversion' | 'timing' | 'retention' | 'content';
  title: string;
  description: string;
  actionLabel: string;
  estimatedImpact: number; // 1-5 scale
}

export interface CustomerBehaviorInsights {
  activeCustomersThisWeek: number;
  repeatCustomerCount: number;
  averageInteractionsPerCustomer: number;
  totalUniqueCustomers: number;
  peakHours: number[]; // 0-23
  peakDays: string[]; // 'Mon', 'Tue', etc
  customerSegments: {
    highEngagement: number; // 3+ interactions
    mediumEngagement: number; // 1-2 interactions
    lowEngagement: number; // browsing only
  };
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_WEIGHTS: Record<string, number> = {
  chat_start: 3,
  directions_request: 2,
  profile_view: 1,
};

/**
 * Calculate engagement metrics for a vendor over a time window
 */
export function calculateEngagementMetrics(
  events: AnalyticsEventRecord[],
  windowMs: number = 7 * 24 * 60 * 60 * 1000
): EngagementMetrics {
  const now = Date.now();
  const windowStart = now - windowMs;
  const windowEvents = events.filter((e) => e.timestamp >= windowStart);

  const profileViews = windowEvents.filter((e) => e.type === 'profile_view').length;
  const directionRequests = windowEvents.filter((e) => e.type === 'directions_request').length;
  const chatStarts = windowEvents.filter((e) => e.type === 'chat_start').length;
  const totalInteractions = windowEvents.length;

  // Unique days with activity
  const activeDays = new Set(windowEvents.map((e) => Math.floor(e.timestamp / (24 * 60 * 60 * 1000))));
  const daysInWindow = Math.ceil(windowMs / (24 * 60 * 60 * 1000));

  const averageInteractionsPerDay = activeDays.size > 0 ? totalInteractions / activeDays.size : 0;
  const engagementRate = daysInWindow > 0 ? activeDays.size / daysInWindow : 0;

  // Weighted engagement score (0-100)
  const engagementScore = windowEvents.reduce((sum, e) => sum + (EVENT_WEIGHTS[e.type] ?? 1), 0);
  const maxPossibleScore = totalInteractions * 3;
  const weightedScore = maxPossibleScore === 0 ? 0 : Math.min(100, Math.round((engagementScore / maxPossibleScore) * 100));

  // Trend detection: compare first half vs second half
  const midpoint = windowStart + windowMs / 2;
  const firstHalf = windowEvents.filter((e) => e.timestamp < midpoint).length;
  const secondHalf = windowEvents.filter((e) => e.timestamp >= midpoint).length;
  const trend: 'increasing' | 'stable' | 'declining' =
    secondHalf > firstHalf * 1.2 ? 'increasing' : firstHalf > secondHalf * 1.2 ? 'declining' : 'stable';

  const engagementLabel: 'high' | 'medium' | 'low' =
    weightedScore >= 70 ? 'high' : weightedScore >= 40 ? 'medium' : 'low';

  return {
    totalInteractions,
    profileViews,
    directionRequests,
    chatStarts,
    engagementRate: Math.round(engagementRate * 100) / 100,
    averageInteractionsPerDay: Math.round(averageInteractionsPerDay * 10) / 10,
    engagementTrend: trend,
    engagementScore: weightedScore,
    engagementLabel,
  };
}

/**
 * Calculate growth metrics including trends and week-over-week comparison
 */
export function calculateGrowthMetrics(
  events: AnalyticsEventRecord[],
  competitorCount: number = 5 // estimated competition in locality
): GrowthMetrics {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const twoWeekMs = 2 * oneWeekMs;

  // Current window (last 7 days)
  const currentStart = now - oneWeekMs;
  const currentEvents = events.filter((e) => e.timestamp >= currentStart);

  // Previous window (7-14 days ago)
  const previousStart = now - twoWeekMs;
  const previousEvents = events.filter((e) => e.timestamp >= previousStart && e.timestamp < currentStart);

  const currentBase = calculateEngagementMetrics(currentEvents, oneWeekMs);
  const prevBase = calculateEngagementMetrics(previousEvents, oneWeekMs);

  // Week-over-week growth
  const weekOverWeekGrowth =
    prevBase.totalInteractions === 0
      ? currentBase.totalInteractions > 0
        ? 100
        : 0
      : Math.round(((currentBase.totalInteractions - prevBase.totalInteractions) / prevBase.totalInteractions) * 100);

  // Same growth delta for ranking
  const growthDelta = weekOverWeekGrowth;

  // Estimated rank movement (positive = improving rank)
  const estimatedRankMovement = growthDelta > 20 ? 1 : growthDelta > 0 ? 0 : -1;

  // Conversion rate: chat starts / profile views
  const conversionRate =
    currentBase.profileViews > 0 ? Math.round((currentBase.chatStarts / currentBase.profileViews) * 100) : 0;

  // Customer retention: repeat interactions by same user
  const uniqueCustomers = new Set(currentEvents.filter((e) => e.actorUserId).map((e) => e.actorUserId)).size;
  const repeatCount = uniqueCustomers > 0
    ? Array.from(new Set(currentEvents.filter((e) => e.actorUserId).map((e) => e.actorUserId)))
        .filter((userId) => currentEvents.filter((e) => e.actorUserId === userId).length > 1).length
    : 0;
  const customerRetention = uniqueCustomers > 0 ? Math.round((repeatCount / uniqueCustomers) * 100) : 0;

  // Peak engagement hour
  const hourCounts = new Array(24).fill(0);
  currentEvents.forEach((e) => {
    const hour = new Date(e.timestamp).getHours();
    hourCounts[hour]++;
  });
  const peakEngagementHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Peak engagement day
  const dayCounts = new Array(7).fill(0);
  currentEvents.forEach((e) => {
    const day = new Date(e.timestamp).getDay();
    dayCounts[day]++;
  });
  const peakEngagementDay = DAYS[dayCounts.indexOf(Math.max(...dayCounts))];

  return {
    ...currentBase,
    growthDelta,
    weekOverWeekGrowth,
    estimatedRankMovement,
    conversionRate,
    customerRetention,
    peakEngagementHour,
    peakEngagementDay,
  };
}

/**
 * Analyze customer behavior patterns
 */
export function analyzeCustomerBehavior(
  events: AnalyticsEventRecord[],
  windowMs: number = 7 * 24 * 60 * 60 * 1000
): CustomerBehaviorInsights {
  const now = Date.now();
  const windowStart = now - windowMs;
  const windowEvents = events.filter((e) => e.timestamp >= windowStart);

  // Unique customers
  const uniqueCustomerIds = new Set(windowEvents.filter((e) => e.actorUserId).map((e) => e.actorUserId));
  const totalUniqueCustomers = uniqueCustomerIds.size;

  // Repeat customers
  const customerInteractionCounts: Record<string, number> = {};
  windowEvents.forEach((e) => {
    if (e.actorUserId) {
      customerInteractionCounts[e.actorUserId] = (customerInteractionCounts[e.actorUserId] || 0) + 1;
    }
  });
  const repeatCustomerCount = Object.values(customerInteractionCounts).filter((count) => count > 1).length;
  const averageInteractionsPerCustomer =
    totalUniqueCustomers > 0 ? Math.round((windowEvents.length / totalUniqueCustomers) * 10) / 10 : 0;

  // Peak hours and days
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  windowEvents.forEach((e) => {
    const date = new Date(e.timestamp);
    hourCounts[date.getHours()]++;
    dayCounts[date.getDay()]++;
  });

  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((x) => x.hour);

  const peakDays = dayCounts
    .map((count, day) => ({ day: DAYS[day], count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((x) => x.day);

  // Customer segments based on interaction count
  const segments = Object.values(customerInteractionCounts).reduce(
    (acc, count) => {
      if (count >= 3) acc.highEngagement++;
      else if (count >= 1) acc.mediumEngagement++;
      else acc.lowEngagement++;
      return acc;
    },
    { highEngagement: 0, mediumEngagement: 0, lowEngagement: 0 }
  );

  return {
    activeCustomersThisWeek: totalUniqueCustomers,
    repeatCustomerCount,
    averageInteractionsPerCustomer,
    totalUniqueCustomers,
    peakHours,
    peakDays,
    customerSegments: segments,
  };
}

/**
 * Generate growth recommendations based on metrics
 */
export function generateGrowthRecommendations(
  metrics: GrowthMetrics,
  insights: CustomerBehaviorInsights,
  isBoostActive: boolean = false,
  tierName: string = 'free'
): GrowthRecommendation[] {
  const recommendations: GrowthRecommendation[] = [];

  // Low engagement recommendations
  if (metrics.engagementLabel === 'low') {
    recommendations.push({
      priority: 'urgent',
      category: 'engagement',
      title: 'Low Engagement Score',
      description: `Your engagement score is ${metrics.engagementScore}. Most customers view but don't take action.`,
      actionLabel: 'Boost visibility',
      estimatedImpact: 4,
    });
  }

  // Low conversion recommendations
  if (metrics.conversionRate < 10 && metrics.profileViews > 5) {
    recommendations.push({
      priority: 'high',
      category: 'conversion',
      title: 'Low Conversion Rate',
      description: `Only ${metrics.conversionRate}% of profile viewers start a chat. Improve your profile or make it easier to contact you.`,
      actionLabel: 'Edit profile',
      estimatedImpact: 3,
    });
  }

  // Declining trend
  if (metrics.engagementTrend === 'declining') {
    recommendations.push({
      priority: 'high',
      category: 'engagement',
      title: 'Declining Engagement',
      description: 'Your engagement is trending downward. Consider updating your status or reaching out to recent customers.',
      actionLabel: 'View insights',
      estimatedImpact: 3,
    });
  }

  // Peak hour optimization
  if (metrics.peakEngagementHour > 0 && insights.peakHours.length > 0) {
    const peakHour = metrics.peakEngagementHour;
    recommendations.push({
      priority: 'medium',
      category: 'timing',
      title: `Peak Activity at ${peakHour}:00`,
      description: `Most customers interact around ${peakHour}:00. Stay available and responsive during this window.`,
      actionLabel: 'View schedule',
      estimatedImpact: 2,
    });
  }

  // Low retention recommendations
  if (metrics.customerRetention < 30 && insights.totalUniqueCustomers > 3) {
    recommendations.push({
      priority: 'medium',
      category: 'retention',
      title: 'Low Customer Retention',
      description: `Only ${metrics.customerRetention}% of customers return. Build relationships to encourage repeat business.`,
      actionLabel: 'View recent customers',
      estimatedImpact: 3,
    });
  }

  // Boost upgrade (if free tier)
  if (tierName === 'free' && !isBoostActive && metrics.totalInteractions > 20) {
    recommendations.push({
      priority: 'high',
      category: 'engagement',
      title: 'Ready for Boost?',
      description: `You're getting good traction (${metrics.totalInteractions} interactions). Boost to reach more customers.`,
      actionLabel: 'Upgrade to Boost',
      estimatedImpact: 5,
    });
  }

  // Positive momentum
  if (metrics.weekOverWeekGrowth > 30) {
    recommendations.push({
      priority: 'low',
      category: 'engagement',
      title: 'Great Growth!',
      description: `You're seeing ${metrics.weekOverWeekGrowth}% week-over-week growth. Keep up the momentum!`,
      actionLabel: 'View analytics',
      estimatedImpact: 1,
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get a readability label for a metric value
 */
export function getMetricLabel(metric: string, value: number): string {
  switch (metric) {
    case 'conversionRate':
      return value >= 20 ? 'Excellent' : value >= 10 ? 'Good' : value >= 5 ? 'Average' : 'Low';
    case 'customerRetention':
      return value >= 50 ? 'Excellent' : value >= 30 ? 'Good' : value >= 15 ? 'Average' : 'Low';
    case 'engagementRate':
      return value >= 0.7 ? 'Daily' : value >= 0.4 ? 'Consistent' : 'Irregular';
    default:
      return '';
  }
}
