import { create } from 'zustand';
import { clearAnalyticsEvents, loadAnalyticsEvents, persistAnalyticsEvent, flushPendingAnalyticsEvents, flushPendingAnalyticsEventsIfOnline, getSyncMetadata } from '../lib/analyticsDataProvider';
import { subscribeToAnalyticsUpdates } from '../lib/analyticsRealtimeProvider';

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
  realtimeConnected: boolean;
  realtimeLastUpdateAt: number | null;
  realtimeUnsubscribe: (() => void) | null;
  hydrateAnalyticsEvents: (actorUserId?: string | null) => Promise<void>;
  trackProfileView: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  trackDirectionsRequest: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  trackChatStart: (vendorId: string, context?: { actorUserId?: string; localityId?: number }) => void;
  flushPendingEvents: () => Promise<void>;
  subscribeToRealtimeUpdates: (vendorId: string) => void;
  unsubscribeFromRealtimeUpdates: () => void;
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
  realtimeConnected: false,
  realtimeLastUpdateAt: null,
  realtimeUnsubscribe: null,

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
    set((state) => ({
      analyticsEvents: [...state.analyticsEvents, event].slice(-100) // Pruning: Keep only latest 100 locally
    }));
    void persistAnalyticsEvent(event).then((result) => {
      set({ analyticsPendingCount: result.pendingCount });
    });
  },

  trackDirectionsRequest: (vendorId, context) => {
    const event = buildEvent('directions_request', vendorId, context);
    set((state) => ({
      analyticsEvents: [...state.analyticsEvents, event].slice(-100)
    }));
    void persistAnalyticsEvent(event).then((result) => {
      set({ analyticsPendingCount: result.pendingCount });
    });
  },

  trackChatStart: (vendorId, context) => {
    const event = buildEvent('chat_start', vendorId, context);
    set((state) => ({
      analyticsEvents: [...state.analyticsEvents, event].slice(-100)
    }));
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

  subscribeToRealtimeUpdates: (vendorId) => {
    // First unsubscribe from any existing subscription
    const state = useAnalyticsStore.getState();
    if (state.realtimeUnsubscribe) {
      state.realtimeUnsubscribe();
    }

    // Subscribe to new vendor's realtime updates
    const unsubscribe = subscribeToAnalyticsUpdates(vendorId, (events, realtimeState) => {
      set({
        analyticsEvents: events,
        realtimeConnected: realtimeState.isConnected,
        realtimeLastUpdateAt: realtimeState.lastUpdateAt,
      });
    });

    set({ realtimeUnsubscribe: unsubscribe });
  },

  unsubscribeFromRealtimeUpdates: () => {
    const state = useAnalyticsStore.getState();
    if (state.realtimeUnsubscribe) {
      state.realtimeUnsubscribe();
      set({ 
        realtimeUnsubscribe: null,
        realtimeConnected: false,
        realtimeLastUpdateAt: null,
      });
    }
  },

  setNetworkAvailable: (available) => {
    set({ networkAvailable: available });
  },

  resetAnalytics: () => {
    const state = useAnalyticsStore.getState();
    if (state.realtimeUnsubscribe) {
      state.realtimeUnsubscribe();
    }
    set({ 
      analyticsEvents: [], 
      analyticsSyncSource: 'local', 
      analyticsPendingCount: 0, 
      lastRemoteSyncAt: null,
      networkAvailable: false,
      realtimeConnected: false,
      realtimeLastUpdateAt: null,
      realtimeUnsubscribe: null,
    });
    void clearAnalyticsEvents();
  },
}));
