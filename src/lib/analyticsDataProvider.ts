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
const ANALYTICS_PENDING_STORAGE_KEY = 'vend.analytics.pending.v1';
const ANALYTICS_SYNC_METADATA_KEY = 'vend.analytics.sync.v1';

export interface AnalyticsLoadResult {
  events: AnalyticsEventRecord[];
  source: 'local' | 'remote';
  pendingCount: number;
}

export interface AnalyticsSyncMetadata {
  lastRemoteSyncAt: number | null;
  lastRemoteSyncAttemptAt: number | null;
}

export interface AnalyticsPersistResult {
  synced: boolean;
  pendingCount: number;
}

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

const readPendingEvents = async (): Promise<AnalyticsEventRecord[]> => {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_PENDING_STORAGE_KEY);
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

const writePendingEvents = async (events: AnalyticsEventRecord[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ANALYTICS_PENDING_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore queue write failures to avoid blocking UI.
  }
};

const readSyncMetadata = async (): Promise<AnalyticsSyncMetadata> => {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_SYNC_METADATA_KEY);
    if (!raw) {
      return { lastRemoteSyncAt: null, lastRemoteSyncAttemptAt: null };
    }
    return JSON.parse(raw) as AnalyticsSyncMetadata;
  } catch {
    return { lastRemoteSyncAt: null, lastRemoteSyncAttemptAt: null };
  }
};

const writeSyncMetadata = async (metadata: AnalyticsSyncMetadata): Promise<void> => {
  try {
    await AsyncStorage.setItem(ANALYTICS_SYNC_METADATA_KEY, JSON.stringify(metadata));
  } catch {
    // Ignore metadata write failures
  }
};

export const getSyncMetadata = async (): Promise<AnalyticsSyncMetadata> => {
  return readSyncMetadata();
};

const toAnalyticsInsertRow = (event: AnalyticsEventRecord) => ({
  id: event.id,
  event_type: event.type,
  vendor_id: event.vendorId,
  event_timestamp: new Date(event.timestamp).toISOString(),
  source: event.source,
  actor_user_id: event.actorUserId ?? null,
  locality_id: event.localityId ?? null,
});

export const getPendingAnalyticsCount = async (): Promise<number> => {
  const pending = await readPendingEvents();
  return pending.length;
};

export const flushPendingAnalyticsEvents = async (): Promise<AnalyticsPersistResult> => {
  const pending = await readPendingEvents();
  if (pending.length === 0) {
    return { synced: true, pendingCount: 0 };
  }

  if (!isSupabaseConfigured()) {
    return { synced: false, pendingCount: pending.length };
  }

  const metadata = await readSyncMetadata();
  await writeSyncMetadata({
    ...metadata,
    lastRemoteSyncAttemptAt: Date.now(),
  });

  const failed: AnalyticsEventRecord[] = [];

  for (const event of pending) {
    try {
      const { error } = await supabase.from('analytics_events').upsert(toAnalyticsInsertRow(event), {
        onConflict: 'id',
      });
      if (error) {
        failed.push(event);
      }
    } catch {
      failed.push(event);
    }
  }

  await writePendingEvents(failed);
  if (failed.length === 0) {
    await writeSyncMetadata({
      lastRemoteSyncAt: Date.now(),
      lastRemoteSyncAttemptAt: Date.now(),
    });
  }
  return { synced: failed.length === 0, pendingCount: failed.length };
};

export const loadAnalyticsEvents = async (actorUserId?: string | null): Promise<AnalyticsLoadResult> => {
  const localEvents = await readLocalEvents();
  const flushResult = await flushPendingAnalyticsEvents();

  if (!isSupabaseConfigured() || !actorUserId) {
    return {
      events: localEvents,
      source: 'local',
      pendingCount: flushResult.pendingCount,
    };
  }

  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('id,event_type,vendor_id,event_timestamp,source,actor_user_id,locality_id')
      .eq('actor_user_id', actorUserId)
      .order('event_timestamp', { ascending: true })
      .limit(5000);

    if (error || !data) {
      return {
        events: localEvents,
        source: 'local',
        pendingCount: flushResult.pendingCount,
      };
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
    return {
      events: remoteEvents,
      source: 'remote',
      pendingCount: flushResult.pendingCount,
    };
  } catch {
    return {
      events: localEvents,
      source: 'local',
      pendingCount: flushResult.pendingCount,
    };
  }
};

export const persistAnalyticsEvent = async (event: AnalyticsEventRecord): Promise<AnalyticsPersistResult> => {
  const localEvents = await readLocalEvents();
  await writeLocalEvents([...localEvents, event]);

  if (!isSupabaseConfigured()) {
    const pending = await readPendingEvents();
    const nextPending = [...pending, event];
    await writePendingEvents(nextPending);
    return { synced: false, pendingCount: nextPending.length };
  }

  try {
    const { error } = await supabase.from('analytics_events').upsert(toAnalyticsInsertRow(event), {
      onConflict: 'id',
    });

    if (error) {
      const pending = await readPendingEvents();
      const nextPending = [...pending, event];
      await writePendingEvents(nextPending);
      return { synced: false, pendingCount: nextPending.length };
    }

    const pending = await readPendingEvents();
    return { synced: pending.length === 0, pendingCount: pending.length };
  } catch {
    const pending = await readPendingEvents();
    const nextPending = [...pending, event];
    await writePendingEvents(nextPending);
    return { synced: false, pendingCount: nextPending.length };
  }
};

export const clearAnalyticsEvents = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
    await AsyncStorage.removeItem(ANALYTICS_PENDING_STORAGE_KEY);
    await AsyncStorage.removeItem(ANALYTICS_SYNC_METADATA_KEY);
  } catch {
    // No-op
  }
};
