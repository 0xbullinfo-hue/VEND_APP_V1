import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';
import { useApp } from '../../contexts/AppContext';

const { width } = Dimensions.get('window');

interface VendorGrowthScreenProps {
  onBack: () => void;
}

export const VendorGrowthScreen: React.FC<VendorGrowthScreenProps> = ({ onBack }) => {
  const { analyticsEvents, myVendorProfile, vendors } = useApp();

  const vendor = myVendorProfile || vendors[0];
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
        </View>

        <View style={styles.sectionHeader}>
          <VText variant="h3" color={theme.colors.textMuted} style={{ fontSize: normalize(12), letterSpacing: 1 }}>7-DAY IMPACT SNAPSHOT</VText>
        </View>

        <View style={styles.impactCard}>
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
        </View>

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
  impactMetricCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
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
});
