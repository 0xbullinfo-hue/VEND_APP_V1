import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Alert } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

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
  
  // Use the logged-in vendor's own linked business profile.
  const vendor = myVendorProfile || vendors[0];

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
        <TouchableOpacity activeOpacity={0.9} onPress={onViewProfile} style={styles.profileCard}>
          <Image source={{ uri: vendor.image }} style={styles.businessLogo} />
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

        {/* VISIBILITY OPTIMIZER */}
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

        {/* GROWTH & PRESENCE */}
        <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.lg }]}>
          <VText variant="h2" style={{ fontSize: normalize(18) }}>Growth & Presence</VText>
          <TouchableOpacity onPress={onViewGrowth} style={styles.dailySnapshotBadge}>
            <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold', fontSize: normalize(10) }}>DAILY SNAPSHOT</VText>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>+45</VText>
            </View>
            <VText variant="h1" style={{ fontSize: normalize(24), marginVertical: 4 }}>1,240</VText>
            <VText variant="caption" color={theme.colors.textMuted}>Visibility Points</VText>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <Ionicons name="people" size={20} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>Active</VText>
            </View>
            <VText variant="h1" style={{ fontSize: normalize(24), marginVertical: 4 }}>382</VText>
            <VText variant="caption" color={theme.colors.textMuted}>User Check-ins</VText>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <Ionicons name="cube" size={20} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>Good</VText>
            </View>
            <VText variant="h1" style={{ fontSize: normalize(24), marginVertical: 4 }}>94%</VText>
            <VText variant="caption" color={theme.colors.textMuted}>Active Services</VText>
          </View>
        </ScrollView>

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
    width: width * 0.4,
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
});

