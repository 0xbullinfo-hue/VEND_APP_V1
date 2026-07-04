import { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';
import { AnalyticsEventRecord } from './analyticsDataProvider';

export interface RealtimeAnalyticsState {
  isConnected: boolean;
  lastUpdateAt: number | null;
  eventCount: number;
}

type RealtimeUpdateCallback = (events: AnalyticsEventRecord[], state: RealtimeAnalyticsState) => void;

class AnalyticsRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private vendorId: string | null = null;
  private listeners: Map<string, RealtimeUpdateCallback> = new Map();
  private eventCache: Map<string, AnalyticsEventRecord> = new Map();
  private state: RealtimeAnalyticsState = {
    isConnected: false,
    lastUpdateAt: null,
    eventCount: 0,
  };

  /**
   * Subscribe to realtime updates for a vendor's analytics events.
   * Returns unsubscribe function.
   */
  public subscribe(vendorId: string, callback: RealtimeUpdateCallback): () => void {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured; realtime unavailable');
      return () => {};
    }

    const callbackId = `callback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.listeners.set(callbackId, callback);

    // If already subscribed to same vendor, just add listener
    if (this.vendorId === vendorId && this.channel) {
      return () => {
        this.listeners.delete(callbackId);
      };
    }

    // Unsubscribe from old vendor if different
    if (this.vendorId !== vendorId && this.channel) {
      this.disconnect();
    }

    this.vendorId = vendorId;
    this.connect();

    return () => {
      this.listeners.delete(callbackId);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private connect(): void {
    if (!this.vendorId || !isSupabaseConfigured()) {
      return;
    }

    try {
      // Subscribe to INSERT events where vendor_id matches
      this.channel = supabase
        .channel(`analytics_vendor_${this.vendorId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'analytics_events',
            filter: `vendor_id=eq.${this.vendorId}`,
          },
          (payload: any) => {
            this.handleRealtimeEvent(payload);
          }
        )
        .subscribe(() => {
          this.state.isConnected = true;
          this.notifyListeners();
        });
    } catch (err) {
      console.error('Failed to subscribe to realtime analytics:', err);
      this.state.isConnected = false;
    }
  }

  private disconnect(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.vendorId = null;
      this.eventCache.clear();
      this.state = {
        isConnected: false,
        lastUpdateAt: null,
        eventCount: 0,
      };
    }
  }

  private handleRealtimeEvent(payload: any): void {
    try {
      const row = payload.new;
      const event: AnalyticsEventRecord = {
        id: row.id,
        type: row.event_type,
        vendorId: row.vendor_id,
        timestamp: Date.parse(row.event_timestamp),
        source: row.source,
        actorUserId: row.actor_user_id || undefined,
        localityId: row.locality_id || undefined,
      };

      // Deduplicate: don't re-add if already in cache
      if (!this.eventCache.has(event.id)) {
        this.eventCache.set(event.id, event);
        this.state.lastUpdateAt = Date.now();
        this.state.eventCount = this.eventCache.size;
        this.notifyListeners();
      }
    } catch (err) {
      console.error('Failed to process realtime analytics event:', err);
    }
  }

  private notifyListeners(): void {
    const events = Array.from(this.eventCache.values());
    this.listeners.forEach((callback) => {
      callback(events, this.state);
    });
  }

  public getState(): RealtimeAnalyticsState {
    return { ...this.state };
  }

  public getEvents(): AnalyticsEventRecord[] {
    return Array.from(this.eventCache.values());
  }
}

// Singleton instance
const manager = new AnalyticsRealtimeManager();

export const subscribeToAnalyticsUpdates = (
  vendorId: string,
  callback: RealtimeUpdateCallback
): (() => void) => {
  return manager.subscribe(vendorId, callback);
};

export const getRealtimeAnalyticsState = (): RealtimeAnalyticsState => {
  return manager.getState();
};

export const getRealtimeAnalyticsEvents = (): AnalyticsEventRecord[] => {
  return manager.getEvents();
};
