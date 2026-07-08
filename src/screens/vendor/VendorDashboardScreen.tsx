import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Alert } from 'react-native';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VImage } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { computeRankUpNudge } from '../../lib/rankUpNudge';
import { useProximityNotificationStore } from '../../store/useProximityNotificationStore';
import { filterNotifications } from '../../lib/notificationCenterUtils';

const { width } = Dimensions.get('window');

interface VendorDashboardScreenProps {
  onManageProducts: () => void;
  onManageSubscription: () => void;
  onLogout: () => void;
  onStartChat: (customerId: string) => void;
  onViewGrowth?: () => void; // Optional because AppNavigation handles it
  onViewProfile?: () => void;
}

export const VendorDashboardScreen: React.FC<VendorDashboardScreenProps> = ({
  onManageProducts,
  onManageSubscription,
  onLogout,
  onViewGrowth,
  onStartChat,
  onViewProfile
}) => {
  const { vendors, myVendorProfile, myVendorPlan } = useApp();
  const { notifications } = useProximityNotificationStore();
  
  // Get nearby customer notifications (vendor perspective)
  const nearbyCustomers = filterNotifications(notifications, {
    type: 'vendor_customer_nearby',
    unreadOnly: false,
  });
  
  // Use the logged-in vendor's own linked business profile.
  const vendor = myVendorProfile || vendors[0];
  const rankedLocalityVendors = vendors.filter((item) => item.locality_id === vendor.locality_id);
  const rankingPosition = Math.max(1, rankedLocalityVendors.findIndex((item) => item.id === vendor.id) + 1);
  const boostedCompetitors = rankedLocalityVendors.filter((item) => item.subscription_tier > 1).length;
  const visibilityDelta = myVendorPlan.boosted ? '+38%' : '+7%';
  const estimatedWeeklyLeads = myVendorPlan.boosted ? 24 : 11;
  const rankingHint = myVendorPlan.boosted
    ? 'Boost tier keeps your profile above standard listings when customers browse your locality.'
    : 'Upgrade to Premium Boosted to move ahead of standard listings in customer discovery.';

  const rankUpNudge = computeRankUpNudge(vendor, rankedLocalityVendors);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <VText variant="h2" style={{ fontSize: normalize(22) }}>Dashboard</VText>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellIcon}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.textMain} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(600)}>
          <TouchableOpacity activeOpacity={0.9} onPress={onViewProfile} style={styles.profileCard}>
            <VImage source={vendor.image} style={styles.businessLogo} />
            <View style={styles.businessInfo}>
              <VText variant="h2" style={{ marginBottom: 4 }}>{vendor.business_name}</VText>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <VText variant="caption" color={theme.colors.primary}>
                  Store is visible to customers
                </VText>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(600)}>
          <View style={[styles.sectionHeader, { marginTop: theme.spacing.xs }]}>
            <VText variant="h2" style={{ fontSize: normalize(18) }}>Boost Impact Analytics</VText>
          </View>

          <View style={[styles.boostImpactCard, theme.shadows.soft]}>
            <View style={styles.boostImpactHeaderRow}>
              <View>
                <VText variant="caption" color={theme.colors.textMuted}>LOCALITY RANK POSITION</VText>
                <VText variant="h1" style={{ fontSize: normalize(28), marginTop: 2 }}>#{rankingPosition}</VText>
              </View>
              <View style={styles.planPill}>
                <Ionicons name={myVendorPlan.boosted ? 'sparkles' : 'diamond-outline'} size={14} color={theme.colors.primary} />
                <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6, fontWeight: '700' }}>
                  {myVendorPlan.name}
                </VText>
              </View>
            </View>

            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCell}>
                <VText variant="caption" color={theme.colors.textMuted}>Visibility Lift</VText>
                <VText variant="h2" color={theme.colors.primary} style={{ marginTop: 2 }}>{visibilityDelta}</VText>
              </View>
              <View style={styles.analyticsCell}>
                <VText variant="caption" color={theme.colors.textMuted}>Boosted Competitors</VText>
                <VText variant="h2" style={{ marginTop: 2 }}>{boostedCompetitors}</VText>
              </View>
              <View style={styles.analyticsCell}>
                <VText variant="caption" color={theme.colors.textMuted}>Est. Weekly Leads</VText>
                <VText variant="h2" style={{ marginTop: 2 }}>{estimatedWeeklyLeads}</VText>
              </View>
            </View>

            <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
              {rankingHint}
            </VText>

            {!myVendorPlan.boosted && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onManageSubscription}
                style={styles.upgradePromptBtn}
              >
                <Ionicons name="rocket-outline" size={16} color="#FFFFFF" />
                <VText variant="caption" color="#FFFFFF" style={{ marginLeft: 8, fontWeight: '700' }}>
                  Upgrade To Premium Boosted
                </VText>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* RANK-UP NUDGE */}
        {rankUpNudge.type !== 'already_top' && (
          <View style={[
            styles.rankNudgeCard,
            rankUpNudge.urgent && styles.rankNudgeCardUrgent,
          ]}>
            <View style={styles.rankNudgeTop}>
              <View style={[
                styles.rankNudgeIconWrap,
                { backgroundColor: rankUpNudge.urgent ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.10)' },
              ]}>
                <Ionicons
                  name={rankUpNudge.urgent ? 'flash' : 'trending-up'}
                  size={18}
                  color={rankUpNudge.urgent ? '#8B5CF6' : theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {rankUpNudge.urgent && (
                    <View style={styles.urgentBadge}>
                      <VText variant="caption" color="#8B5CF6" style={{ fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>CLOSE!</VText>
                    </View>
                  )}
                  <VText variant="h3" style={{ fontSize: normalize(14), fontWeight: '700' }}>{rankUpNudge.message}</VText>
                </View>
                <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 2, lineHeight: 17 }}>{rankUpNudge.subMessage}</VText>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.rankNudgeBtn, rankUpNudge.urgent && styles.rankNudgeBtnUrgent]}
              activeOpacity={0.85}
              onPress={() => {
                if (rankUpNudge.type === 'upgrade') onManageSubscription();
                else onViewGrowth?.();
              }}
            >
              <VText
                variant="caption"
                color={rankUpNudge.urgent ? '#8B5CF6' : theme.colors.primary}
                style={{ fontWeight: '700' }}
              >
                {rankUpNudge.actionLabel}
              </VText>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={rankUpNudge.urgent ? '#8B5CF6' : theme.colors.primary}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* NEARBY CUSTOMERS (Proximity Notifications) */}
        {nearbyCustomers.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={[styles.nearbyCustomersCard, theme.shadows.soft]}>
            <View style={styles.nearbyHeader}>
              <View style={styles.nearbyIconWrap}>
                <Ionicons name="location-sharp" size={18} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <VText variant="h3" style={{ fontSize: normalize(15), fontWeight: '700' }}>
                  Customers Nearby
                </VText>
                <VText variant="caption" color={theme.colors.textMuted}>
                  {nearbyCustomers.length} previous customer{nearbyCustomers.length > 1 ? 's' : ''} in your area
                </VText>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.customersList}>
              {nearbyCustomers.slice(0, 3).map((customer, index) => (
                <Animated.View
                  key={customer.id}
                  entering={SlideInRight.delay(400 + (index * 100))}
                >
                  <TouchableOpacity
                    onPress={() => onStartChat(customer.triggerEntityId)}
                    style={[styles.customerChip, theme.shadows.soft]}
                  >
                    <Ionicons name="person-circle" size={32} color={theme.colors.primary} />
                    <VText variant="caption" style={{ fontSize: 10, marginTop: 4, textAlign: 'center' }}>
                      {customer.triggerEntityName.split('\n')[0]}
                    </VText>
                    {customer.distance && (
                      <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 9, marginTop: 2 }}>
                        {customer.distance.toFixed(1)}km
                      </VText>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
              {nearbyCustomers.length > 3 && (
                <View style={[styles.customerChip, styles.moreChip]}>
                  <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '700' }}>
                    +{nearbyCustomers.length - 3}
                  </VText>
                  <VText variant="caption" color={theme.colors.textMuted} style={{ fontSize: 9 }}>
                    more
                  </VText>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(500).duration(600)}>
          <View style={styles.sectionHeader}>
            <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>VISIBILITY OPTIMIZER (3 Tasks)</VText>
          </View>

          <View style={styles.taskContainer}>
            <View style={styles.taskCard}>
              <View style={styles.taskIconBg}>
                <Ionicons name="camera" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.taskInfo}>
                <VText variant="h3" style={{ fontSize: normalize(15) }}>Post a Daily Snapshot</VText>
                <VText variant="caption" color={theme.colors.textMuted}>Stay active and rank higher today</VText>
              </View>
              <TouchableOpacity style={styles.taskBtn} onPress={() => Alert.alert('Daily Snapshot', 'Camera module will open here.')}>
                <VText variant="caption" color="#FFF" style={{ fontWeight: 'bold' }}>Post</VText>
              </TouchableOpacity>
            </View>

            <View style={[styles.taskCard, { borderBottomWidth: 0 }]}>
              <View style={styles.taskIconBg}>
                <Ionicons name="time" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.taskInfo}>
                <VText variant="h3" style={{ fontSize: normalize(15) }}>Update business hours</VText>
                <VText variant="caption" color={theme.colors.textMuted}>Boost customer trust by 40%</VText>
              </View>
              <TouchableOpacity style={styles.taskBtn} onPress={() => Alert.alert('Update Hours', 'Settings modal will open here.')}>
                <VText variant="caption" color="#FFF" style={{ fontWeight: 'bold' }}>Update</VText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          {/* GROWTH & PRESENCE */}
          <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.lg }]}>
            <VText variant="h2" style={{ fontSize: normalize(18) }}>Growth & Presence</VText>
            <TouchableOpacity onPress={onViewGrowth} style={styles.dailySnapshotBadge}>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold', fontSize: normalize(10) }}>DAILY SNAPSHOT</VText>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
            <Animated.View entering={SlideInRight.delay(100)} style={styles.metricCard}>
              <View style={styles.metricIconRow}>
                <Ionicons name="star" size={20} color={theme.colors.warning} />
                <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>+45</VText>
              </View>
              <VText variant="h1" style={{ fontSize: normalize(24), marginVertical: 4 }}>1,240</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Visibility Points</VText>
            </Animated.View>

            <Animated.View entering={SlideInRight.delay(200)} style={styles.metricCard}>
              <View style={styles.metricIconRow}>
                <Ionicons name="people" size={20} color={theme.colors.primary} />
                <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>Active</VText>
              </View>
              <VText variant="h1" style={{ fontSize: normalize(24), marginVertical: 4 }}>382</VText>
              <VText variant="caption" color={theme.colors.textMuted}>User Check-ins</VText>
            </Animated.View>

            <Animated.View entering={SlideInRight.delay(300)} style={styles.metricCard}>
              <View style={styles.metricIconRow}>
                <Ionicons name="cube" size={20} color={theme.colors.primary} />
                <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>Good</VText>
              </View>
              <VText variant="h1" style={{ fontSize: normalize(24), marginVertical: 4 }}>94%</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Active Services</VText>
            </Animated.View>
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(600)}>
          {/* MANAGE BUSINESS */}
          <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
            <VText variant="h2" style={{ fontSize: normalize(18) }}>Manage Business</VText>
          </View>

          <View style={styles.gridContainer}>
            <TouchableOpacity activeOpacity={0.8} style={styles.gridBox} onPress={onManageProducts}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="storefront" size={24} color={theme.colors.primary} />
              </View>
              <VText variant="h3" style={{ fontSize: normalize(16), marginBottom: 4 }}>Services</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Edit listings</VText>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.gridBox} onPress={() => onStartChat('general')}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="chatbubbles" size={24} color={theme.colors.primary} />
                <View style={styles.gridBadge}>
                  <VText variant="caption" color="#FFF" style={{ fontSize: 10, fontWeight: 'bold' }}>5</VText>
                </View>
              </View>
              <VText variant="h3" style={{ fontSize: normalize(16), marginBottom: 4 }}>Inquiries</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Chat with leads</VText>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.gridBox} onPress={() => Alert.alert('Reviews', 'Review manager will open here.')}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="star-half" size={24} color={theme.colors.primary} />
                <View style={styles.gridBadge}>
                  <VText variant="caption" color="#FFF" style={{ fontSize: 10, fontWeight: 'bold' }}>3</VText>
                </View>
              </View>
              <VText variant="h3" style={{ fontSize: normalize(16), marginBottom: 4 }}>Reviews</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Manage feedback</VText>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.gridBox} onPress={() => { Alert.alert('Redeem', 'Redirecting to Growth Hub...'); onViewGrowth?.(); }}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="rocket" size={24} color={theme.colors.primary} />
              </View>
              <VText variant="h3" style={{ fontSize: normalize(16), marginBottom: 4 }}>Redeem</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Use points</VText>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} style={styles.gridBox} onPress={onManageSubscription}>
              <View style={styles.gridIconCircle}>
                <Ionicons name="diamond" size={24} color={theme.colors.primary} />
              </View>
              <VText variant="h3" style={{ fontSize: normalize(16), marginBottom: 4 }}>Plan</VText>
              <VText variant="caption" color={theme.colors.textMuted}>{myVendorPlan.name}</VText>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bellIcon: {
    padding: 8,
    position: 'relative',
  },
  logoutBtn: {
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: normalize(130), // padding for absolute tab bar
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  businessLogo: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: theme.colors.border,
  },
  businessInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: 6,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  boostImpactCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  boostImpactHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FAFC',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  analyticsCell: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  upgradePromptBtn: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  rankNudgeCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: '#F0F9FF',
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    padding: theme.spacing.lg,
  },
  rankNudgeCardUrgent: {
    backgroundColor: '#FAF5FF',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  rankNudgeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  rankNudgeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  urgentBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rankNudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  rankNudgeBtnUrgent: {
    borderColor: 'rgba(139, 92, 246, 0.4)',
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
  },
  taskContainer: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  taskIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskBtn: {
    backgroundColor: theme.colors.textMain,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dailySnapshotBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  horizontalScroll: {
    flexGrow: 0,
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: normalize(140),
    height: normalize(100),
    justifyContent: 'center',
  },
  metricIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  gridBox: {
    width: (width - normalize(32) - theme.spacing.md) / 2,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  gridBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.danger,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  nearbyCustomersCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  nearbyIconWrap: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: `${theme.colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  customersList: {
    paddingRight: theme.spacing.md,
  },
  customerChip: {
    width: normalize(80),
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: normalize(16),
  },
  moreChip: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
});

