import { create } from 'zustand';

export type AnalyticsEventType = 'profile_view' | 'directions_request' | 'chat_start';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  vendorId: string;
  timestamp: number;
  source: 'customer';
}

interface AnalyticsState {
  analyticsEvents: AnalyticsEvent[];
  trackProfileView: (vendorId: string) => void;
  trackDirectionsRequest: (vendorId: string) => void;
  trackChatStart: (vendorId: string) => void;
  resetAnalytics: () => void;
}

const buildEvent = (type: AnalyticsEventType, vendorId: string): AnalyticsEvent => ({
  id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type,
  vendorId,
  timestamp: Date.now(),
  source: 'customer',
});

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analyticsEvents: [],

  trackProfileView: (vendorId) => {
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, buildEvent('profile_view', vendorId)] }));
  },

  trackDirectionsRequest: (vendorId) => {
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, buildEvent('directions_request', vendorId)] }));
  },

  trackChatStart: (vendorId) => {
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, buildEvent('chat_start', vendorId)] }));
  },

  resetAnalytics: () => {
    set({ analyticsEvents: [] });
  },
}));
