import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VCard, VendorProfilePendingState } from '../../components/SharedComponents';
import { LineChart } from 'react-native-wagmi-charts';
import { Ionicons } from '../../components/VIcons';
import { useApp } from '../../contexts/AppContext';
import { calculateGrowthMetrics, analyzeCustomerBehavior, generateGrowthRecommendations } from '../../lib/vendorGrowthAnalytics';

const { width } = Dimensions.get('window');

interface VendorGrowthScreenProps {
  onBack: () => void;
}

export const VendorGrowthScreen: React.FC<VendorGrowthScreenProps> = ({ onBack }) => {
  const { analyticsEvents, myVendorProfile, vendors, analyticsSyncSource, analyticsPendingCount, lastRemoteSyncAt, networkAvailable, subscribeToRealtimeUpdates, unsubscribeFromRealtimeUpdates, realtimeConnected } = useApp();

  const vendor = myVendorProfile || vendors[0];

  if (!vendor) {
    return <VendorProfilePendingState title="Growth Hub" onBack={onBack} />;
  }

  // Subscribe to realtime updates when screen mounts
  useEffect(() => {
    if (vendor?.id) {
      subscribeToRealtimeUpdates(vendor.id);
    }
    return () => {
      unsubscribeFromRealtimeUpdates();
    };
  }, [vendor?.id, subscribeToRealtimeUpdates, unsubscribeFromRealtimeUpdates]);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const vendorEvents = analyticsEvents.filter((event) => event.vendorId === vendor.id);
  const currentWindow = vendorEvents.filter((event) => event.timestamp >= sevenDaysAgo);
  const previousWindow = vendorEvents.filter(
    (event) => event.timestamp >= fourteenDaysAgo && event.timestamp < sevenDaysAgo
  );

  const profileViews7d = currentWindow.filter((event) => event.type === 'profile_view').length;
  const directions7d = currentWindow.filter((event) => event.type === 'directions_request').length;
  const chats7d = currentWindow.filter((event) => event.type === 'chat_start').length;
  const total7dInteractions = currentWindow.length;
  const totalPrevInteractions = previousWindow.length;
  const growthDeltaPct =
    totalPrevInteractions === 0
      ? total7dInteractions > 0
        ? 100
        : 0
      : Math.round(((total7dInteractions - totalPrevInteractions) / totalPrevInteractions) * 100);

  const localityVendors = vendors.filter((item) => item.locality_id === vendor.locality_id);
  const rankNow = Math.max(1, localityVendors.findIndex((item) => item.id === vendor.id) + 1);
  const estimatedRank7dAgo = Math.min(localityVendors.length || 1, rankNow + (growthDeltaPct > 0 ? 1 : 0));
  const rankMovement = Math.max(0, estimatedRank7dAgo - rankNow);

  // Engagement quality scoring (weights: chat=3, directions=2, profile_view=1)
  const EVENT_WEIGHTS: Record<string, number> = {
    chat_start: 3,
    directions_request: 2,
    profile_view: 1,
  };
  const engagementScore = currentWindow.reduce((sum, e) => sum + (EVENT_WEIGHTS[e.type] ?? 1), 0);
  const maxPossibleScore = currentWindow.length * 3;
  const engagementQuality = maxPossibleScore === 0 ? 0 : Math.min(100, Math.round((engagementScore / maxPossibleScore) * 100));
  const scoreLabel = engagementQuality >= 70 ? 'High' : engagementQuality >= 40 ? 'Medium' : 'Low';
  const scoreColor = engagementQuality >= 70 ? '#10B981' : engagementQuality >= 40 ? '#F59E0B' : '#EF4444';

  // Calculate advanced growth metrics using new utility
  const growthMetrics = calculateGrowthMetrics(vendorEvents);
  const customerInsights = analyzeCustomerBehavior(vendorEvents);
  const recommendations = generateGrowthRecommendations(
    growthMetrics,
    customerInsights,
    vendor?.subscription_tier === 2,
    vendor?.subscription_tier === 2 ? 'boosted' : 'free'
  );

  // Top recommendation to display
  const topRecommendation = recommendations[0];

  // Recent events sorted newest-first, capped at 20 for display
  const recentEvents = [...currentWindow]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  // Mock data for ROI Chart
  const chartData = [
    { timestamp: now - 6 * 24 * 3600000, value: 45 },
    { timestamp: now - 5 * 24 * 3600000, value: 52 },
    { timestamp: now - 4 * 24 * 3600000, value: 48 },
    { timestamp: now - 3 * 24 * 3600000, value: 70 },
    { timestamp: now - 2 * 24 * 3600000, value: 65 },
    { timestamp: now - 1 * 24 * 3600000, value: 88 },
    { timestamp: now, value: 95 },
  ];

  const [expandDrillDown, setExpandDrillDown] = useState(false);
  const visibleEvents = expandDrillDown ? recentEvents : recentEvents.slice(0, 5);

  const formatEventTime = (ts: number): string => {
    const diffMs = now - ts;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const EVENT_META: Record<string, { label: string; icon: string; color: string }> = {
    profile_view: { label: 'Profile View', icon: 'eye-outline', color: theme.colors.primary },
    directions_request: { label: 'Direction Request', icon: 'navigate-outline', color: '#8B5CF6' },
    chat_start: { label: 'Chat Started', icon: 'chatbubble-outline', color: '#10B981' },
  };

  const formatLastSyncTime = (): string => {
    if (!lastRemoteSyncAt) return 'Never';
    const diffMs = now - lastRemoteSyncAt;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return 'over 1d ago';
  };

  // Determine sync pill color: green for synced online, amber for local, red for offline
  const isSynced = analyticsSyncSource === 'remote' && analyticsPendingCount === 0;
  let pillBorderColor = 'rgba(245, 158, 11, 0.35)'; // amber (default - local cache)
  let pillBgColor = '#FFFBEB';
  let dotColor = '#F59E0B';

  if (!networkAvailable) {
    // Offline: red/danger
    pillBorderColor = 'rgba(239, 68, 68, 0.35)';
    pillBgColor = '#FEE2E2';
    dotColor = '#EF4444';
  } else if (isSynced) {
    // Online and synced: green
    pillBorderColor = 'rgba(16, 185, 129, 0.35)';
    pillBgColor = '#ECFDF5';
    dotColor = '#10B981';
  }

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="Growth Hub" 
        showPoints={false} 
        showBack={true}
        onBack={onBack}
        rightComponent={
          <TouchableOpacity style={{ padding: 4 }}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerRow}>
          <VText variant="h2" style={{ fontSize: normalize(22) }}>Growth Hub</VText>
          <View
            style={[
              styles.syncPill,
              {
                borderColor: pillBorderColor,
                backgroundColor: pillBgColor,
              },
            ]}
          >
            <View
              style={[
                styles.syncDot,
                {
                  backgroundColor: dotColor,
                },
              ]}
            />
            <VText variant="caption" color={theme.colors.textMain} style={{ fontWeight: '700', fontSize: 11 }}>
              {!networkAvailable
                ? 'No Network'
                : realtimeConnected
                ? `Live ✓ ${formatLastSyncTime()}`
                : isSynced
                ? `Synced (${formatLastSyncTime()})`
                : `Local Cache${analyticsPendingCount > 0 ? ` (${analyticsPendingCount} pending)` : ''}`}
            </VText>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>7-DAY IMPACT SNAPSHOT</VText>
        </View>

        <Animated.View entering={FadeInUp.duration(600)}>
          <VCard variant="outline" style={styles.impactCard}>
            <View style={styles.impactTopRow}>
              <View>
                <VText variant="caption" color={theme.colors.textMuted}>DISCOVERY MOMENTUM</VText>
                <VText variant="h1" style={{ fontSize: normalize(28), marginTop: 2 }}>
                  {growthDeltaPct >= 0 ? '+' : ''}{growthDeltaPct}%
                </VText>
              </View>
              <View style={styles.rankBadge}>
                <Ionicons name="trending-up" size={14} color={theme.colors.primary} />
                <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 5, fontWeight: '700' }}>
                  #{rankNow} in locality
                </VText>
              </View>
            </View>

            {/* Visual ROI Chart */}
            <View style={styles.chartContainer}>
              <LineChart.Provider data={chartData}>
                <LineChart height={80} width={width - normalize(80)}>
                  <LineChart.Path color={theme.colors.primary} />
                  <LineChart.CursorCrosshair color={theme.colors.primary} />
                </LineChart>
              </LineChart.Provider>
            </View>

            <View style={styles.impactMetricsRow}>
              <View style={styles.impactMetricCell}>
                <VText variant="caption" color={theme.colors.textMuted}>Profile Views</VText>
                <VText variant="h2" style={{ marginTop: 2 }}>{profileViews7d}</VText>
              </View>
              <View style={styles.impactMetricCell}>
                <VText variant="caption" color={theme.colors.textMuted}>Direction Requests</VText>
                <VText variant="h2" style={{ marginTop: 2 }}>{directions7d}</VText>
              </View>
              <View style={styles.impactMetricCell}>
                <VText variant="caption" color={theme.colors.textMuted}>Chat Starts</VText>
                <VText variant="h2" style={{ marginTop: 2 }}>{chats7d}</VText>
              </View>
            </View>

            <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
              Rank moved +{rankMovement} this week based on recent customer interactions across profile views, directions, and chats.
            </VText>

            {/* Engagement Quality Score */}
            <View style={styles.qualityScoreRow}>
              <View style={styles.qualityScoreLeft}>
                <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 11 }}>ENGAGEMENT QUALITY</VText>
                <VText variant="h3" style={{ marginTop: 2, color: scoreColor }}>{scoreLabel}</VText>
              </View>
              <View style={styles.qualityBar}>
                <View style={[styles.qualityFill, { width: `${engagementQuality}%` as any, backgroundColor: scoreColor }]} />
              </View>
              <VText variant="caption" color={scoreColor} style={{ fontWeight: '700', marginLeft: 8, fontSize: 13 }}>{engagementQuality}%</VText>
            </View>
          </VCard>
        </Animated.View>

        {/* RECENT ENGAGEMENT DRILL-DOWN */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>RECENT ENGAGEMENTS</VText>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 11 }}>{recentEvents.length} this week</VText>
          </View>
        </View>

        <View style={styles.drillDownCard}>
          {recentEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={32} color={theme.colors.textMuted} />
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 8, textAlign: 'center' }}>
                No engagement events yet this week. Share your profile to start getting discovered.
              </VText>
            </View>
          ) : (
            <>
              {visibleEvents.map((event, idx) => {
                const meta = EVENT_META[event.type] ?? { label: event.type, icon: 'ellipse-outline', color: theme.colors.textMuted };
                return (
                  <View key={event.id} style={[
                    styles.eventRow,
                    idx < visibleEvents.length - 1 && styles.eventRowBorder,
                  ]}>
                    <View style={[styles.eventIconWrap, { backgroundColor: `${meta.color}18` }]}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    </View>
                    <View style={styles.eventDetails}>
                      <VText variant="body" style={{ fontWeight: '600', fontSize: normalize(13) }}>{meta.label}</VText>
                      {event.localityId ? (
                        <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 1 }}>
                          Locality #{event.localityId}
                        </VText>
                      ) : null}
                    </View>
                    <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 11 }}>
                      {formatEventTime(event.timestamp)}
                    </VText>
                  </View>
                );
              })}
              {recentEvents.length > 5 && (
                <TouchableOpacity style={styles.expandBtn} onPress={() => setExpandDrillDown(prev => !prev)}>
                  <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '700' }}>
                    {expandDrillDown ? 'Show less' : `View all ${recentEvents.length} events`}
                  </VText>
                  <Ionicons
                    name={expandDrillDown ? 'chevron-up-outline' : 'chevron-down-outline'}
                    size={14}
                    color={theme.colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* GROWTH INSIGHTS & RECOMMENDATIONS */}
        {topRecommendation && (
          <>
            <View style={styles.sectionHeader}>
              <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>GROWTH OPPORTUNITY</VText>
            </View>

            <View style={[
              styles.recommendationCard,
              { borderLeftColor: topRecommendation.priority === 'urgent' ? '#EF4444' : topRecommendation.priority === 'high' ? '#F59E0B' : theme.colors.primary }
            ]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <VText variant="h3" style={{ fontSize: normalize(14), fontWeight: 'bold' }}>{topRecommendation.title}</VText>
                  <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4 }}>{topRecommendation.description}</VText>
                </View>
                <View style={[
                  styles.priorityBadge,
                  {
                    backgroundColor: topRecommendation.priority === 'urgent' ? '#FEE2E2' : topRecommendation.priority === 'high' ? '#FEF3C7' : '#EFF6FF'
                  }
                ]}>
                  <VText
                    variant="caption"
                    style={{
                      fontWeight: '700',
                      fontSize: 10,
                      color: topRecommendation.priority === 'urgent' ? '#DC2626' : topRecommendation.priority === 'high' ? '#D97706' : theme.colors.primary
                    }}
                  >
                    {topRecommendation.priority.toUpperCase()}
                  </VText>
                </View>
              </View>
              <TouchableOpacity style={styles.actionBtn}>
                <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>{topRecommendation.actionLabel}</VText>
                <Ionicons name="chevron-forward-outline" size={14} color={theme.colors.primary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* CUSTOMER BEHAVIOR INSIGHTS */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>CUSTOMER BEHAVIOR INSIGHTS</VText>
        </View>

        <View style={styles.insightsCard}>
          <View style={styles.insightRow}>
            <View style={styles.insightItem}>
              <VText variant="caption" color={theme.colors.textMuted}>ACTIVE CUSTOMERS</VText>
              <VText variant="h2" style={{ marginTop: 4 }}>{customerInsights.activeCustomersThisWeek}</VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 2, fontSize: 11 }}>
                {customerInsights.repeatCustomerCount} returning
              </VText>
            </View>

            <View style={styles.insightItem}>
              <VText variant="caption" color={theme.colors.textMuted}>AVG INTERACTIONS</VText>
              <VText variant="h2" style={{ marginTop: 4 }}>{customerInsights.averageInteractionsPerCustomer.toFixed(1)}</VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 2, fontSize: 11 }}>per customer</VText>
            </View>

            <View style={styles.insightItem}>
              <VText variant="caption" color={theme.colors.textMuted}>CONVERSION RATE</VText>
              <VText variant="h2" style={{ marginTop: 4 }}>{growthMetrics.conversionRate}%</VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 2, fontSize: 11 }}>chat conversion</VText>
            </View>
          </View>

          {/* Peak Hours & Days */}
          <View style={[styles.peakTimingsRow, { marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <View style={{ flex: 1 }}>
              <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 11 }}>PEAK HOURS</VText>
              <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                {customerInsights.peakHours.slice(0, 3).map((hour) => (
                  <View key={`hour-${hour}`} style={styles.timingBadge}>
                    <VText variant="caption" style={{ fontWeight: '700', fontSize: 11 }}>{hour}:00</VText>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 11 }}>PEAK DAYS</VText>
              <View style={{ flexDirection: 'row', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                {customerInsights.peakDays.slice(0, 3).map((day) => (
                  <View key={`day-${day}`} style={styles.timingBadge}>
                    <VText variant="caption" style={{ fontWeight: '700', fontSize: 11 }}>{day}</VText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Customer Segments */}
          <View style={[styles.segmentsRow, { marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 11, marginBottom: 8 }}>CUSTOMER SEGMENTS</VText>
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={styles.segmentBadge}>
                <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '700' }}>{customerInsights.customerSegments.highEngagement}</VText>
                <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10 }}>High</VText>
              </View>
              <View style={styles.segmentBadge}>
                <VText variant="caption" color="#F59E0B" style={{ fontWeight: '700' }}>{customerInsights.customerSegments.mediumEngagement}</VText>
                <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10 }}>Medium</VText>
              </View>
              <View style={styles.segmentBadge}>
                <VText variant="caption" color="#9CA3AF" style={{ fontWeight: '700' }}>{customerInsights.customerSegments.lowEngagement}</VText>
                <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10 }}>Low</VText>
              </View>
            </View>
          </View>
        </View>

        {/* RETENTION & GROWTH METRICS */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>RETENTION & GROWTH</VText>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10 }}>WOW GROWTH</VText>
            <VText variant="h2" style={{ marginTop: 6, color: growthMetrics.weekOverWeekGrowth >= 0 ? '#10B981' : '#EF4444' }}>
              {growthMetrics.weekOverWeekGrowth >= 0 ? '+' : ''}{growthMetrics.weekOverWeekGrowth}%
            </VText>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10, marginTop: 4 }}>week-over-week</VText>
          </View>

          <View style={styles.metricBox}>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10 }}>RETENTION RATE</VText>
            <VText variant="h2" style={{ marginTop: 6, color: growthMetrics.customerRetention >= 30 ? '#10B981' : '#F59E0B' }}>
              {growthMetrics.customerRetention}%
            </VText>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10, marginTop: 4 }}>repeat customers</VText>
          </View>

          <View style={styles.metricBox}>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10 }}>ENGAGEMENT TREND</VText>
            <VText variant="h2" style={{ marginTop: 6, textTransform: 'capitalize', fontSize: normalize(16) }}>
              {growthMetrics.engagementTrend === 'increasing' ? '📈' : growthMetrics.engagementTrend === 'declining' ? '📉' : '→'} {growthMetrics.engagementTrend}
            </VText>
            <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 10, marginTop: 4 }}>7-day trend</VText>
          </View>
        </View>

        {/* ALL RECOMMENDATIONS */}
        {recommendations.length > 1 && (
          <>
            <View style={styles.sectionHeader}>
              <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>MORE OPPORTUNITIES ({recommendations.length})</VText>
            </View>

            <View style={styles.recommendationsList}>
              {recommendations.slice(1, 4).map((rec, idx) => (
                <View key={idx} style={[
                  styles.recCard,
                  idx < Math.min(recommendations.length - 1, 3) && { marginBottom: theme.spacing.sm }
                ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                    <View style={[
                      styles.recIcon,
                      {
                        backgroundColor: rec.priority === 'urgent' ? '#FEE2E2' : rec.priority === 'high' ? '#FEF3C7' : '#EFF6FF'
                      }
                    ]}>
                      <Ionicons
                        name="bulb-outline"
                        size={14}
                        color={rec.priority === 'urgent' ? '#DC2626' : rec.priority === 'high' ? '#D97706' : theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <VText variant="body" style={{ fontSize: normalize(12), fontWeight: '600' }}>{rec.title}</VText>
                      <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 2, fontSize: 11 }}>{rec.description}</VText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* HERO CARD - POINTS */}
        <View style={[styles.heroCard, theme.shadows.soft]}>
          <VText variant="caption" color="#FFF" style={{ opacity: 0.8, letterSpacing: 1 }}>TOTAL VISIBILITY POINTS</VText>
          <VText variant="h1" color="#FFF" style={{ fontSize: normalize(42), marginVertical: 8 }}>2,450</VText>
          
          <View style={styles.heroBtnRow}>
            <TouchableOpacity style={styles.boostBtn}>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>Boost Rank</VText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyBtn}>
              <VText variant="caption" color="#FFF" style={{ fontWeight: 'bold' }}>Point History</VText>
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE OPTIMIZER */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>PROFILE OPTIMIZER</VText>
        </View>

        <View style={styles.optimizerCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <VText variant="h3">Profile Strength</VText>
            <VText variant="h3" color={theme.colors.primary}>80%</VText>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '80%' }]} />
          </View>
          <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 8 }}>
            Add 2 more photos to your gallery to achieve 100% and unlock the 'Verified Vendor' badge.
          </VText>
        </View>

        {/* MANAGE LISTINGS SUMMARY */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>MANAGE LISTINGS</VText>
        </View>
        <TouchableOpacity activeOpacity={0.8} style={styles.manageListingsCard}>
          <View style={styles.mlLeft}>
            <Ionicons name="pricetag-outline" size={24} color={theme.colors.primary} />
            <View style={{ marginLeft: 12 }}>
              <VText variant="h3">Active Products</VText>
              <VText variant="caption" color={theme.colors.textMuted}>4 Items Listed</VText>
            </View>
          </View>
          <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>View All</VText>
        </TouchableOpacity>

        {/* FLASH VISIBILITY BOOST */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>FLASH VISIBILITY BOOST</VText>
        </View>

        <View style={styles.flashCard}>
          <View style={styles.flashHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <VText variant="caption" color={theme.colors.danger} style={{ fontWeight: 'bold', fontSize: 10 }}>LIVE</VText>
            </View>
            <VText variant="caption" color={theme.colors.textMuted}>ACTIVE BOOST STATUS: <VText variant="caption" color={theme.colors.textMain} style={{ fontWeight: 'bold' }}>42:18</VText> remaining</VText>
          </View>

          <TouchableOpacity style={styles.triggerBtn}>
            <Ionicons name="flash" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <VText variant="body" color="#FFF" style={{ fontWeight: 'bold' }}>Trigger 1-Hour Flash Boost (150 pts)</VText>
          </TouchableOpacity>
          
          <VText variant="caption" color={theme.colors.textMuted} style={{ textAlign: 'center', marginTop: 12 }}>
            Nearby users will get notified of your active status.
          </VText>
        </View>

        {/* VISIBILITY INSIGHTS */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>VISIBILITY INSIGHTS (Last 30 Days)</VText>
        </View>

        <View style={styles.insightsGrid}>
          <View style={styles.insightBox}>
            <VText variant="caption" color={theme.colors.textMuted}>VIEWS</VText>
            <View style={styles.insightValueRow}>
              <VText variant="h2" style={{ fontSize: normalize(20) }}>1,284</VText>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold', marginLeft: 8 }}>(+12.5%)</VText>
            </View>
          </View>
          
          <View style={styles.insightBox}>
            <VText variant="caption" color={theme.colors.textMuted}>NAVS</VText>
            <View style={styles.insightValueRow}>
              <VText variant="h2" style={{ fontSize: normalize(20) }}>342</VText>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold', marginLeft: 8 }}>(+8.2%)</VText>
            </View>
          </View>
        </View>

        {/* LONG-TERM BOOSTS */}
        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>LONG-TERM BOOSTS</VText>
        </View>

        <View style={styles.boostList}>
          <View style={styles.boostListItem}>
            <View style={styles.boostIcon}>
              <Ionicons name="search" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.boostInfo}>
              <VText variant="h3" style={{ fontSize: normalize(15) }}>Search Top Placement</VText>
              <VText variant="caption" color={theme.colors.textMuted}>24h priority results</VText>
            </View>
            <TouchableOpacity style={styles.redeemBtn}>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>800 pts</VText>
            </TouchableOpacity>
          </View>

          <View style={styles.boostListItem}>
            <View style={styles.boostIcon}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.boostInfo}>
              <VText variant="h3" style={{ fontSize: normalize(15) }}>Map Pin Highlight</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Custom pin color for 48h</VText>
            </View>
            <TouchableOpacity style={styles.redeemBtn}>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>500 pts</VText>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: normalize(100),
  },
  headerRow: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  heroCard: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  heroBtnRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  boostBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  historyBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  impactCard: {
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  impactTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  impactMetricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  chartContainer: {
    marginVertical: theme.spacing.md,
    alignItems: 'center',
  },
  impactMetricCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  qualityScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  qualityScoreLeft: {
    width: 90,
    marginRight: theme.spacing.sm,
  },
  qualityBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  qualityFill: {
    height: '100%',
    borderRadius: 3,
  },
  drillDownCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  eventRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  eventIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDetails: {
    flex: 1,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  optimizerCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  manageListingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashCard: {
    backgroundColor: '#FFF8E8',
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: '#FFE0A8',
  },
  flashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.danger,
    marginRight: 4,
  },
  triggerBtn: {
    backgroundColor: theme.colors.textMain,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: normalize(12),
  },
  insightsGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  insightBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  insightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  boostList: {
    marginHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  boostListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  boostIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boostInfo: {
    flex: 1,
    marginLeft: 12,
  },
  redeemBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderLeftWidth: 4,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingVertical: 8,
  },
  insightsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  insightItem: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: normalize(8),
  },
  peakTimingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timingBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  segmentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  segmentBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  metricBox: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recommendationsList: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  recCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

