import { create } from 'zustand';
import { clearAnalyticsEvents, loadAnalyticsEvents, persistAnalyticsEvent } from '../lib/analyticsDataProvider';

export type AnalyticsEventType = 'profile_view' | 'directions_request' | 'chat_start';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  vendorId: string;
  timestamp: number;
  source: 'customer';
  actorUserId?: string;
  localityId?: number;
}

interface AnalyticsState {
  analyticsEvents: AnalyticsEvent[];
  hydrateAnalyticsEvents: (actorUserId?: string | null) => Promise<void>;
  trackProfileView: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  trackDirectionsRequest: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  trackChatStart: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  resetAnalytics: () => void;
}

const buildEvent = (
  type: AnalyticsEventType,
  vendorId: string,
  context?: { actorUserId?: string; localityId?: number }
): AnalyticsEvent => ({
  id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type,
  vendorId,
  timestamp: Date.now(),
  source: 'customer',
  actorUserId: context?.actorUserId,
  localityId: context?.localityId,
});

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analyticsEvents: [],

  hydrateAnalyticsEvents: async (actorUserId) => {
    const events = await loadAnalyticsEvents(actorUserId);
    set({ analyticsEvents: events });
  },

  trackProfileView: (vendorId, context) => {
    const event = buildEvent('profile_view', vendorId, context);
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, event] }));
    void persistAnalyticsEvent(event);
  },

  trackDirectionsRequest: (vendorId, context) => {
    const event = buildEvent('directions_request', vendorId, context);
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, event] }));
    void persistAnalyticsEvent(event);
  },

  trackChatStart: (vendorId, context) => {
    const event = buildEvent('chat_start', vendorId, context);
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, event] }));
    void persistAnalyticsEvent(event);
  },

  resetAnalytics: () => {
    set({ analyticsEvents: [] });
    void clearAnalyticsEvents();
  },
}));
