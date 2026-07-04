import { create } from 'zustand';
import { clearAnalyticsEvents, loadAnalyticsEvents, persistAnalyticsEvent, flushPendingAnalyticsEvents, flushPendingAnalyticsEventsIfOnline, getSyncMetadata } from '../lib/analyticsDataProvider';

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
  analyticsSyncSource: 'local' | 'remote';
  analyticsPendingCount: number;
  lastRemoteSyncAt: number | null;
  networkAvailable: boolean;
  hydrateAnalyticsEvents: (actorUserId?: string | null) => Promise<void>;
  trackProfileView: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  trackDirectionsRequest: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  trackChatStart: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  flushPendingEvents: () => Promise<void>;
  setNetworkAvailable: (available: boolean) => void;
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
  analyticsSyncSource: 'local',
  analyticsPendingCount: 0,
  lastRemoteSyncAt: null,
  networkAvailable: false,

  hydrateAnalyticsEvents: async (actorUserId) => {
    const result = await loadAnalyticsEvents(actorUserId);
    const metadata = await getSyncMetadata();
    set({
      analyticsEvents: result.events,
      analyticsSyncSource: result.source,
      analyticsPendingCount: result.pendingCount,
      lastRemoteSyncAt: metadata.lastRemoteSyncAt,
    });
  },

  trackProfileView: (vendorId, context) => {
    const event = buildEvent('profile_view', vendorId, context);
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, event] }));
    void persistAnalyticsEvent(event).then((result) => {
      set({ analyticsPendingCount: result.pendingCount });
    });
  },

  trackDirectionsRequest: (vendorId, context) => {
    const event = buildEvent('directions_request', vendorId, context);
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, event] }));
    void persistAnalyticsEvent(event).then((result) => {
      set({ analyticsPendingCount: result.pendingCount });
    });
  },

  trackChatStart: (vendorId, context) => {
    const event = buildEvent('chat_start', vendorId, context);
    set((state) => ({ analyticsEvents: [...state.analyticsEvents, event] }));
    void persistAnalyticsEvent(event).then((result) => {
      set({ analyticsPendingCount: result.pendingCount });
    });
  },

  flushPendingEvents: async () => {
    const result = await flushPendingAnalyticsEventsIfOnline();
    const metadata = await getSyncMetadata();
    set({
      analyticsPendingCount: result.pendingCount,
      analyticsSyncSource: result.synced ? 'remote' : 'local',
      lastRemoteSyncAt: metadata.lastRemoteSyncAt,
      networkAvailable: result.networkAvailable,
    });
  },

  setNetworkAvailable: (available) => {
    set({ networkAvailable: available });
  },

  resetAnalytics: () => {
    set({ 
      analyticsEvents: [], 
      analyticsSyncSource: 'local', 
      analyticsPendingCount: 0, 
      lastRemoteSyncAt: null,
      networkAvailable: false,
    });
    void clearAnalyticsEvents();
  },
}));
