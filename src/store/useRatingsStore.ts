import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Ratings & Reviews Models
 */
export interface Rating {
  id: string;
  vendorId: string;
  customerId: string;
  customerName: string;
  score: number; // 1-5
  timestamp: number;
  isVerifiedPurchase: boolean;
}

export interface Review {
  id: string;
  vendorId: string;
  customerId: string;
  customerName: string;
  title: string;
  body: string;
  rating: number; // 1-5
  timestamp: number;
  isVerifiedPurchase: boolean;
  helpful: number; // Count of "helpful" votes
  unhelpful: number; // Count of "unhelpful" votes
}

export interface VendorRatingSummary {
  vendorId: string;
  averageRating: number; // 0-5
  totalRatings: number;
  totalReviews: number;
  ratingDistribution: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
  verifiedPurchaseCount: number;
  recentReviews: Review[];
  topReviews: Review[]; // Most helpful reviews
}

interface RatingsStore {
  // State
  reviews: Map<string, Review[]>; // vendorId -> reviews
  ratings: Map<string, Rating[]>; // vendorId -> ratings
  customerRatings: Map<string, number>; // vendorId + customerId -> rating
  customerId: string | null;
  
  // Actions
  submitReview: (review: Omit<Review, 'id' | 'timestamp'>) => string;
  submitRating: (vendorId: string, customerId: string, score: number, isVerifiedPurchase: boolean) => void;
  getRatingSummary: (vendorId: string) => VendorRatingSummary;
  getVendorReviews: (vendorId: string, limit?: number) => Review[];
  getVendorRating: (vendorId: string) => number;
  markReviewAsHelpful: (reviewId: string, vendorId: string) => void;
  markReviewAsUnhelpful: (reviewId: string, vendorId: string) => void;
  deleteReview: (reviewId: string, vendorId: string) => void;
  setCustomerId: (customerId: string) => void;
}

export const useRatingsStore = create<RatingsStore>()(
  persist(
    (set, get) => ({
      reviews: new Map(),
      ratings: new Map(),
      customerRatings: new Map(),
      customerId: null,

      submitReview: (review: Omit<Review, 'id' | 'timestamp'>) => {
        const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullReview: Review = {
          ...review,
          id: reviewId,
          timestamp: Date.now(),
          helpful: 0,
          unhelpful: 0,
        };

        set((state) => {
          const vendorReviews = state.reviews.get(review.vendorId) || [];
          const updated = new Map(state.reviews);
          updated.set(review.vendorId, [fullReview, ...vendorReviews]);

          // Also update ratings
          const ratingsUpdated = new Map(state.ratings);
          const vendorRatings = state.ratings.get(review.vendorId) || [];
          const newRating: Rating = {
            id: `rating_${reviewId}`,
            vendorId: review.vendorId,
            customerId: review.customerId,
            customerName: review.customerName,
            score: review.rating,
            timestamp: Date.now(),
            isVerifiedPurchase: review.isVerifiedPurchase,
          };
          ratingsUpdated.set(review.vendorId, [newRating, ...vendorRatings]);

          // Track customer rating
          const customerKey = `${review.vendorId}_${review.customerId}`;
          const customerRatingsUpdated = new Map(state.customerRatings);
          customerRatingsUpdated.set(customerKey, review.rating);

          return {
            reviews: updated,
            ratings: ratingsUpdated,
            customerRatings: customerRatingsUpdated,
          };
        });

        return reviewId;
      },

      submitRating: (vendorId: string, customerId: string, score: number, isVerifiedPurchase: boolean) => {
        set((state) => {
          const ratingId = `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newRating: Rating = {
            id: ratingId,
            vendorId,
            customerId,
            customerName: 'Anonymous',
            score: Math.max(1, Math.min(5, score)), // Clamp 1-5
            timestamp: Date.now(),
            isVerifiedPurchase,
          };

          const vendorRatings = state.ratings.get(vendorId) || [];
          const updated = new Map(state.ratings);
          updated.set(vendorId, [newRating, ...vendorRatings]);

          // Track customer rating
          const customerKey = `${vendorId}_${customerId}`;
          const customerRatingsUpdated = new Map(state.customerRatings);
          customerRatingsUpdated.set(customerKey, score);

          return {
            ratings: updated,
            customerRatings: customerRatingsUpdated,
          };
        });
      },

      getRatingSummary: (vendorId: string): VendorRatingSummary => {
        const state = get();
        const ratings = state.ratings.get(vendorId) || [];
        const reviews = state.reviews.get(vendorId) || [];

        if (ratings.length === 0) {
          return {
            vendorId,
            averageRating: 0,
            totalRatings: 0,
            totalReviews: 0,
            ratingDistribution: {
              fiveStar: 0,
              fourStar: 0,
              threeStar: 0,
              twoStar: 0,
              oneStar: 0,
            },
            verifiedPurchaseCount: 0,
            recentReviews: [],
            topReviews: [],
          };
        }

        // Calculate average rating
        const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
        const averageRating = Math.round((totalScore / ratings.length) * 10) / 10;

        // Distribution
        const distribution = {
          fiveStar: ratings.filter((r) => r.score === 5).length,
          fourStar: ratings.filter((r) => r.score === 4).length,
          threeStar: ratings.filter((r) => r.score === 3).length,
          twoStar: ratings.filter((r) => r.score === 2).length,
          oneStar: ratings.filter((r) => r.score === 1).length,
        };

        const verifiedPurchaseCount = ratings.filter((r) => r.isVerifiedPurchase).length;

        // Recent reviews (sorted by timestamp desc)
        const recentReviews = [...reviews]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        // Top reviews (sorted by helpful votes desc)
        const topReviews = [...reviews]
          .sort((a, b) => (b.helpful - b.unhelpful) - (a.helpful - a.unhelpful))
          .slice(0, 5);

        return {
          vendorId,
          averageRating,
          totalRatings: ratings.length,
          totalReviews: reviews.length,
          ratingDistribution: distribution,
          verifiedPurchaseCount,
          recentReviews,
          topReviews,
        };
      },

      getVendorReviews: (vendorId: string, limit = 10): Review[] => {
        const state = get();
        const reviews = state.reviews.get(vendorId) || [];
        return reviews.slice(0, limit);
      },

      getVendorRating: (vendorId: string): number => {
        const state = get();
        const summary = get().getRatingSummary(vendorId);
        return summary.averageRating;
      },

      markReviewAsHelpful: (reviewId: string, vendorId: string) => {
        set((state) => {
          const vendorReviews = state.reviews.get(vendorId) || [];
          const updated = new Map(state.reviews);
          const newReviews = vendorReviews.map((r) =>
            r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
          );
          updated.set(vendorId, newReviews);
          return { reviews: updated };
        });
      },

      markReviewAsUnhelpful: (reviewId: string, vendorId: string) => {
        set((state) => {
          const vendorReviews = state.reviews.get(vendorId) || [];
          const updated = new Map(state.reviews);
          const newReviews = vendorReviews.map((r) =>
            r.id === reviewId ? { ...r, unhelpful: r.unhelpful + 1 } : r
          );
          updated.set(vendorId, newReviews);
          return { reviews: updated };
        });
      },

      deleteReview: (reviewId: string, vendorId: string) => {
        set((state) => {
          const vendorReviews = state.reviews.get(vendorId) || [];
          const updated = new Map(state.reviews);
          const filtered = vendorReviews.filter((r) => r.id !== reviewId);
          updated.set(vendorId, filtered);
          return { reviews: updated };
        });
      },

      setCustomerId: (customerId: string) => {
        set({ customerId });
      },
    }),
    {
      name: 'ratings-reviews-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        reviews: Array.from(state.reviews.entries()),
        ratings: Array.from(state.ratings.entries()),
        customerRatings: Array.from(state.customerRatings.entries()),
        customerId: state.customerId,
      }),
      merge: (persistedState: any, currentState) => {
        if (persistedState?.reviews) {
          persistedState.reviews = new Map(persistedState.reviews);
        }
        if (persistedState?.ratings) {
          persistedState.ratings = new Map(persistedState.ratings);
        }
        if (persistedState?.customerRatings) {
          persistedState.customerRatings = new Map(persistedState.customerRatings);
        }
        return { ...currentState, ...persistedState };
      },
    }
  )
);
