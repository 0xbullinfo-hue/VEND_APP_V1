import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';

export type AnalyticsEventType = 'profile_view' | 'directions_request' | 'chat_start';

export interface AnalyticsEventRecord {
  id: string;
  type: AnalyticsEventType;
  vendorId: string;
  timestamp: number;
  source: 'customer';
  actorUserId?: string;
  localityId?: number;
}

interface AnalyticsEventRow {
  id: string;
  event_type: AnalyticsEventType;
  vendor_id: string;
  event_timestamp: string;
  source: 'customer';
  actor_user_id: string | null;
  locality_id: number | null;
}

const ANALYTICS_STORAGE_KEY = 'vend.analytics.events.v1';

const readLocalEvents = async (): Promise<AnalyticsEventRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as AnalyticsEventRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

const writeLocalEvents = async (events: AnalyticsEventRecord[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore local persistence failures and keep app responsive.
  }
};

export const loadAnalyticsEvents = async (actorUserId?: string | null): Promise<AnalyticsEventRecord[]> => {
  const localEvents = await readLocalEvents();

  if (!isSupabaseConfigured() || !actorUserId) {
    return localEvents;
  }

  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('id,event_type,vendor_id,event_timestamp,source,actor_user_id,locality_id')
      .eq('actor_user_id', actorUserId)
      .order('event_timestamp', { ascending: true })
      .limit(5000);

    if (error || !data) {
      return localEvents;
    }

    const remoteEvents = (data as AnalyticsEventRow[]).map((row) => ({
      id: row.id,
      type: row.event_type,
      vendorId: row.vendor_id,
      timestamp: Date.parse(row.event_timestamp),
      source: row.source,
      actorUserId: row.actor_user_id || undefined,
      localityId: row.locality_id || undefined,
    }));

    await writeLocalEvents(remoteEvents);
    return remoteEvents;
  } catch {
    return localEvents;
  }
};

export const persistAnalyticsEvent = async (event: AnalyticsEventRecord): Promise<void> => {
  const localEvents = await readLocalEvents();
  await writeLocalEvents([...localEvents, event]);

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await supabase.from('analytics_events').insert({
      id: event.id,
      event_type: event.type,
      vendor_id: event.vendorId,
      event_timestamp: new Date(event.timestamp).toISOString(),
      source: event.source,
      actor_user_id: event.actorUserId ?? null,
      locality_id: event.localityId ?? null,
    });
  } catch {
    // Local copy already persisted; remote sync can retry in future sessions.
  }
};

export const clearAnalyticsEvents = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
  } catch {
    // No-op
  }
};
