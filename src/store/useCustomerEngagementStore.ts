import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Engagement Tracking Models
 */
export interface BrowsingEvent {
  vendorId: string;
  vendorName: string;
  category?: string;
  timestamp: number;
  durationSeconds: number; // How long they viewed
  interactionType: 'view' | 'favorite' | 'share' | 'contact';
}

export interface CustomerPreference {
  categoryId: string;
  categoryName: string;
  interactionCount: number;
  averageRating?: number;
  lastInteractionTime: number;
  score: number; // 0-100 preference strength
}

export interface VendorInteractionHistory {
  vendorId: string;
  viewCount: number;
  favoriteCount: number;
  shareCount: number;
  contactCount: number;
  totalInteractionTime: number; // seconds
  firstViewTime: number;
  lastViewTime: number;
  conversationStarted: boolean;
}

export interface CustomerEngagementMetrics {
  totalBrowsingTime: number; // seconds
  totalVendorsViewed: number;
  averageViewDuration: number; // seconds
  mostRecentVendors: BrowsingEvent[]; // Last 10
  categoryPreferences: CustomerPreference[];
  vendorInteractionHistory: Map<string, VendorInteractionHistory>;
  engagementScore: number; // 0-100
  engagementLevel: 'high' | 'medium' | 'low';
  peakBrowsingHours: number[]; // 0-23
}

interface EngagementStore {
  // State
  browsingHistory: BrowsingEvent[];
  categoryPreferences: CustomerPreference[];
  vendorInteractionHistory: Map<string, VendorInteractionHistory>;
  engagementScore: number;
  lastSessionTime: number;
  
  // Actions
  addBrowsingEvent: (event: Omit<BrowsingEvent, 'timestamp'>) => void;
  recordVendorInteraction: (vendorId: string, type: 'view' | 'favorite' | 'share' | 'contact', durationSeconds?: number) => void;
  updateCategoryPreferences: () => void;
  markVendorAsFavorite: (vendorId: string) => void;
  startVendorConversation: (vendorId: string) => void;
  clearBrowsingHistory: () => void;
  getMetrics: () => CustomerEngagementMetrics;
}

export const useCustomerEngagementStore = create<EngagementStore>()(
  persist(
    (set, get) => ({
      browsingHistory: [],
      categoryPreferences: [],
      vendorInteractionHistory: new Map(),
      engagementScore: 0,
      lastSessionTime: Date.now(),

      addBrowsingEvent: (event: Omit<BrowsingEvent, 'timestamp'>) => {
        set((state) => {
          const newEvent: BrowsingEvent = {
            ...event,
            timestamp: Date.now(),
          };

          const history = [newEvent, ...state.browsingHistory].slice(0, 100); // Keep last 100

          return {
            browsingHistory: history,
            lastSessionTime: Date.now(),
          };
        });
      },

      recordVendorInteraction: (vendorId: string, type: 'view' | 'favorite' | 'share' | 'contact', durationSeconds = 0) => {
        set((state) => {
          const history = new Map(state.vendorInteractionHistory);
          const existing = history.get(vendorId) || {
            vendorId,
            viewCount: 0,
            favoriteCount: 0,
            shareCount: 0,
            contactCount: 0,
            totalInteractionTime: 0,
            firstViewTime: Date.now(),
            lastViewTime: Date.now(),
            conversationStarted: false,
          };

          const updated = { ...existing, lastViewTime: Date.now() };

          if (type === 'view') {
            updated.viewCount += 1;
            updated.totalInteractionTime += durationSeconds;
          } else if (type === 'favorite') {
            updated.favoriteCount += 1;
          } else if (type === 'share') {
            updated.shareCount += 1;
          } else if (type === 'contact') {
            updated.contactCount += 1;
          }

          history.set(vendorId, updated);

          return {
            vendorInteractionHistory: history,
            lastSessionTime: Date.now(),
          };
        });
      },

      updateCategoryPreferences: () => {
        set((state) => {
          const categoryMap = new Map<string, { name: string; interactions: BrowsingEvent[] }>();

          // Group browsing events by category
          state.browsingHistory.forEach((event) => {
            const category = event.category || 'uncategorized';
            if (!categoryMap.has(category)) {
              categoryMap.set(category, { name: category, interactions: [] });
            }
            categoryMap.get(category)!.interactions.push(event);
          });

          // Calculate preference scores
          const preferences = Array.from(categoryMap.entries()).map(([categoryId, data]) => {
            const interactions = data.interactions;
            const interactionCount = interactions.length;
            const avgDuration = interactions.reduce((sum, e) => sum + e.durationSeconds, 0) / interactionCount;
            const recencyBonus = interactions[0] ? (Date.now() - interactions[0].timestamp) / (1000 * 60 * 60 * 24) : 0; // days ago
            
            // Score: more interactions + longer views + recent = higher score
            let score = Math.min(100, interactionCount * 10 + Math.min(30, avgDuration / 10) - Math.min(20, recencyBonus * 2));
            score = Math.max(0, score);

            return {
              categoryId,
              categoryName: data.name,
              interactionCount,
              lastInteractionTime: interactions[0]?.timestamp || Date.now(),
              score,
            };
          });

          preferences.sort((a, b) => b.score - a.score);

          return {
            categoryPreferences: preferences,
          };
        });
      },

      markVendorAsFavorite: (vendorId: string) => {
        get().recordVendorInteraction(vendorId, 'favorite');
      },

      startVendorConversation: (vendorId: string) => {
        set((state) => {
          const history = new Map(state.vendorInteractionHistory);
          const existing = history.get(vendorId);
          if (existing) {
            existing.conversationStarted = true;
            history.set(vendorId, existing);
          }
          return { vendorInteractionHistory: history };
        });
      },

      clearBrowsingHistory: () => {
        set({
          browsingHistory: [],
          categoryPreferences: [],
          vendorInteractionHistory: new Map(),
          engagementScore: 0,
        });
      },

      getMetrics: (): CustomerEngagementMetrics => {
        const state = get();
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        // Filter events from last 7 days
        const recentEvents = state.browsingHistory.filter((e) => e.timestamp > sevenDaysAgo);

        // Calculate metrics
        const totalBrowsingTime = recentEvents.reduce((sum, e) => sum + e.durationSeconds, 0);
        const totalVendorsViewed = new Set(recentEvents.map((e) => e.vendorId)).size;
        const averageViewDuration = recentEvents.length > 0 ? totalBrowsingTime / recentEvents.length : 0;

        // Peak browsing hours
        const hourMap = new Map<number, number>();
        recentEvents.forEach((e) => {
          const hour = new Date(e.timestamp).getHours();
          hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });
        const peakBrowsingHours = Array.from(hourMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([hour]) => hour);

        // Engagement score calculation
        let engagementScore = 0;
        if (recentEvents.length > 0) {
          const frequencyScore = Math.min(30, recentEvents.length * 3); // More browsing
          const durationScore = Math.min(30, totalBrowsingTime / 60); // Longer views
          const varietyScore = Math.min(40, totalVendorsViewed * 4); // More vendors
          engagementScore = Math.min(100, frequencyScore + durationScore + varietyScore);
        }

        const engagementLevel = engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low';

        return {
          totalBrowsingTime,
          totalVendorsViewed,
          averageViewDuration,
          mostRecentVendors: recentEvents.slice(0, 10),
          categoryPreferences: state.categoryPreferences,
          vendorInteractionHistory: state.vendorInteractionHistory,
          engagementScore,
          engagementLevel,
          peakBrowsingHours,
        };
      },
    }),
    {
      name: 'customer-engagement-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        browsingHistory: state.browsingHistory,
        categoryPreferences: state.categoryPreferences,
        vendorInteractionHistory: Array.from(state.vendorInteractionHistory.entries()),
        engagementScore: state.engagementScore,
      }),
      merge: (persistedState: any, currentState) => {
        if (persistedState?.vendorInteractionHistory) {
          persistedState.vendorInteractionHistory = new Map(persistedState.vendorInteractionHistory);
        }
        return { ...currentState, ...persistedState };
      },
    }
  )
);
