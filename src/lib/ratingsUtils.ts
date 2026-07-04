import { Review, Rating, VendorRatingSummary } from '../store/useRatingsStore';

/**
 * Ratings & Reviews Analytics Utilities
 */

export interface ReviewQualityScore {
  relevance: number; // 0-100: Is it useful?
  specificity: number; // 0-100: Does it mention specific details?
  authenticity: number; // 0-100: Does it seem genuine?
  helpfulness: number; // 0-100: Overall helpfulness
}

export interface ReviewTrend {
  period: string; // '7d', '30d', '90d'
  averageRating: number;
  totalReviews: number;
  ratingTrend: 'improving' | 'declining' | 'stable';
  trendPercentage: number; // % change
}

export interface CustomerRatingInsight {
  title: string;
  description: string;
  type: 'positive' | 'concern' | 'neutral';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate quality score for a single review
 */
export function calculateReviewQualityScore(review: Review): ReviewQualityScore {
  // Relevance: Based on helpful/unhelpful ratio
  const totalHelpfulness = review.helpful + review.unhelpful;
  const relevance = totalHelpfulness === 0 ? 50 : Math.round((review.helpful / totalHelpfulness) * 100);

  // Specificity: Based on body length and detail indicators
  const detailWords = ['specifically', 'detailed', 'exactly', 'definitely', 'really', 'actually', 'absolutely'];
  const hasDetails = detailWords.some((word) => review.body.toLowerCase().includes(word));
  const bodyLength = review.body.length;
  const specificity = Math.min(100, (bodyLength / 200) * 50 + (hasDetails ? 30 : 0));

  // Authenticity: Verified purchase + detailed title + body
  const verifiedBonus = review.isVerifiedPurchase ? 30 : 0;
  const titleLength = review.title.length;
  const titleBonus = titleLength > 10 ? 20 : 0;
  const authenticity = Math.min(100, verifiedBonus + titleBonus + 20);

  // Helpfulness: Combination of all factors
  const helpfulness = Math.round((relevance + specificity + authenticity) / 3);

  return {
    relevance: Math.max(0, Math.min(100, relevance)),
    specificity: Math.max(0, Math.min(100, specificity)),
    authenticity: Math.max(0, Math.min(100, authenticity)),
    helpfulness: Math.max(0, Math.min(100, helpfulness)),
  };
}

/**
 * Analyze rating trend over time periods
 */
export function analyzeRatingTrend(ratings: Rating[], period = '30d'): ReviewTrend {
  const now = Date.now();
  const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 : period === '90d' ? 90 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const halfPeriod = periodMs / 2;

  const currentPeriod = ratings.filter((r) => r.timestamp > now - periodMs);
  const firstHalf = currentPeriod.filter((r) => r.timestamp > now - periodMs && r.timestamp <= now - halfPeriod);
  const secondHalf = currentPeriod.filter((r) => r.timestamp > now - halfPeriod);

  const avgFirst = firstHalf.length === 0 ? 0 : firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length;
  const avgSecond = secondHalf.length === 0 ? 0 : secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length;

  const averageRating = Math.round((avgSecond * 10) / 10);
  const totalReviews = currentPeriod.length;

  let ratingTrend: 'improving' | 'declining' | 'stable' = 'stable';
  let trendPercentage = 0;

  if (avgFirst > 0) {
    const change = ((avgSecond - avgFirst) / avgFirst) * 100;
    trendPercentage = Math.round(Math.abs(change));
    if (change > 5) {
      ratingTrend = 'improving';
    } else if (change < -5) {
      ratingTrend = 'declining';
    }
  }

  return {
    period,
    averageRating,
    totalReviews,
    ratingTrend,
    trendPercentage,
  };
}

/**
 * Extract sentiment indicators from reviews
 */
export function extractReviewSentiment(review: Review): { sentiment: 'positive' | 'negative' | 'neutral'; keywords: string[] } {
  const positivWords = ['excellent', 'great', 'amazing', 'fantastic', 'perfect', 'love', 'best', 'awesome', 'wonderful', 'very good'];
  const negativeWords = ['terrible', 'bad', 'horrible', 'awful', 'hate', 'worst', 'disappointed', 'poor', 'useless', 'waste'];

  const bodyLower = (review.body + ' ' + review.title).toLowerCase();
  const positiveMatches = positivWords.filter((word) => bodyLower.includes(word));
  const negativeMatches = negativeWords.filter((word) => bodyLower.includes(word));

  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (positiveMatches.length > negativeMatches.length) {
    sentiment = 'positive';
  } else if (negativeMatches.length > positiveMatches.length) {
    sentiment = 'negative';
  }

  // If no keywords found, infer from rating
  if (positiveMatches.length === 0 && negativeMatches.length === 0) {
    if (review.rating >= 4) sentiment = 'positive';
    else if (review.rating <= 2) sentiment = 'negative';
  }

  const keywords = [...new Set([...positiveMatches, ...negativeMatches])];

  return { sentiment, keywords };
}

/**
 * Generate insights from vendor ratings
 */
export function generateRatingInsights(summary: VendorRatingSummary): CustomerRatingInsight[] {
  const insights: CustomerRatingInsight[] = [];

  // Insight 1: High rating celebration
  if (summary.averageRating >= 4.5) {
    insights.push({
      title: 'Excellent Reputation ⭐',
      description: `${summary.averageRating} average rating from ${summary.totalReviews} reviews. Customers love your service!`,
      type: 'positive',
      priority: 'low',
    });
  }

  // Insight 2: Low rating alert
  if (summary.averageRating < 3 && summary.totalReviews >= 5) {
    insights.push({
      title: 'Below Average Rating',
      description: `Your ${summary.averageRating} rating is below average. Consider addressing customer concerns.`,
      type: 'concern',
      priority: 'high',
    });
  }

  // Insight 3: Few verified purchases concern
  if (summary.totalReviews >= 10 && summary.verifiedPurchaseCount < 3) {
    insights.push({
      title: 'Limited Verified Reviews',
      description: `Only ${summary.verifiedPurchaseCount} verified purchases out of ${summary.totalReviews} reviews. Encourage verified customers to leave reviews.`,
      type: 'neutral',
      priority: 'medium',
    });
  }

  // Insight 4: One-star concern
  const oneStarPercent = summary.totalReviews > 0 ? (summary.ratingDistribution.oneStar / summary.totalReviews) * 100 : 0;
  if (oneStarPercent > 20) {
    insights.push({
      title: 'High Number of Poor Reviews',
      description: `${Math.round(oneStarPercent)}% of reviews are 1-star. Identify and resolve common issues.`,
      type: 'concern',
      priority: 'high',
    });
  }

  // Insight 5: Mostly 5-star
  const fiveStarPercent = summary.totalReviews > 0 ? (summary.ratingDistribution.fiveStar / summary.totalReviews) * 100 : 0;
  if (fiveStarPercent > 70) {
    insights.push({
      title: 'Outstanding Quality 🌟',
      description: `${Math.round(fiveStarPercent)}% of customers gave you 5 stars. You're consistently delivering excellence!`,
      type: 'positive',
      priority: 'low',
    });
  }

  // Insight 6: Growing review count
  if (summary.totalReviews >= 20 && summary.totalReviews <= 30) {
    insights.push({
      title: 'Building Social Proof',
      description: 'You have enough reviews to build credibility. Keep encouraging feedback!',
      type: 'positive',
      priority: 'low',
    });
  }

  // Insight 7: Few reviews (less than 5)
  if (summary.totalReviews < 5 && summary.totalReviews > 0) {
    insights.push({
      title: 'Build Your Reputation',
      description: 'You have only a few reviews. Encourage satisfied customers to leave feedback.',
      type: 'neutral',
      priority: 'medium',
    });
  }

  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Identify common themes in negative reviews
 */
export function identifyNegativeThemes(reviews: Review[]): Map<string, number> {
  const themes = new Map<string, number>();
  const themeKeywords = {
    'Quality Issues': ['poor quality', 'broken', 'defective', 'bad quality', 'cheap'],
    'Service': ['slow', 'rude', 'unprofessional', 'bad service', 'terrible service'],
    'Price': ['expensive', 'overpriced', 'not worth', 'too costly', 'bad value'],
    'Delivery': ['late', 'delayed', 'never arrived', 'missing', 'damaged'],
    'Communication': ['no response', 'didn\'t reply', 'no follow up', 'ignored'],
  };

  const negativeReviews = reviews.filter((r) => r.rating <= 2);

  negativeReviews.forEach((review) => {
    const bodyLower = (review.body + ' ' + review.title).toLowerCase();
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some((keyword) => bodyLower.includes(keyword))) {
        themes.set(theme, (themes.get(theme) || 0) + 1);
      }
    });
  });

  // Sort by frequency
  return new Map([...themes.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * Calculate star rating distribution percentage
 */
export function getRatingDistributionPercentages(summary: VendorRatingSummary): Record<string, number> {
  const total = summary.totalRatings || 1;
  return {
    fiveStar: Math.round((summary.ratingDistribution.fiveStar / total) * 100),
    fourStar: Math.round((summary.ratingDistribution.fourStar / total) * 100),
    threeStar: Math.round((summary.ratingDistribution.threeStar / total) * 100),
    twoStar: Math.round((summary.ratingDistribution.twoStar / total) * 100),
    oneStar: Math.round((summary.ratingDistribution.oneStar / total) * 100),
  };
}

/**
 * Calculate vendor reputation score (0-100)
 */
export function calculateReputationScore(summary: VendorRatingSummary): number {
  if (summary.totalRatings === 0) return 0;

  const ratingScore = summary.averageRating * 20; // 0-100 (dominant factor)
  const volumeScore = Math.min(15, summary.totalReviews * 0.5); // Max 15 (minimal volume impact)
  const verifiedBonus = Math.min(8, summary.verifiedPurchaseCount * 0.5); // Max 8 (minimal verified impact)
  const consistencyBonus = summary.ratingDistribution.fiveStar + summary.ratingDistribution.fourStar > summary.totalRatings * 0.7 ? 10 : 0; // 10 if 70%+ 4-5 stars

  return Math.max(0, Math.min(100, Math.round(ratingScore + volumeScore + verifiedBonus + consistencyBonus)));
}

/**
 * Determine if review should be featured
 */
export function isReviewFeatured(review: Review, qualityScore: ReviewQualityScore): boolean {
  return (
    review.isVerifiedPurchase &&
    qualityScore.helpfulness >= 70 &&
    (review.helpful > review.unhelpful || review.helpful + review.unhelpful === 0) &&
    review.body.length >= 50
  );
}
