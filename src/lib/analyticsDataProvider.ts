export {
  getPendingAnalyticsCount,
  flushPendingAnalyticsEvents,
  flushPendingAnalyticsEventsIfOnline,
  loadAnalyticsEvents,
  persistAnalyticsEvent,
  getSyncMetadata,
  clearAnalyticsEvents,
} from '../core/economy/logic/analyticsDataProvider';
export type { AnalyticsEventType, AnalyticsEventRecord, AnalyticsLoadResult, AnalyticsSyncMetadata, AnalyticsPersistResult, AnalyticsNetworkAwareFlushResult } from '../core/economy/logic/analyticsDataProvider';
