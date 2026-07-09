import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Text,
  Platform
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, HeaderBar, VImage, VendorProfilePendingState } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

interface VendorProfileScreenProps {
  vendorId: string;
  onBack: () => void;
  onRequestDirections: (vendorId: string) => void;
  onLeaveReview: (vendorId: string) => void;
  onStartChat: (vendorId: string) => void;
}

export const VendorProfileScreen: React.FC<VendorProfileScreenProps> = ({
  vendorId,
  onBack,
  onRequestDirections,
  onLeaveReview,
  onStartChat
}) => {
  const { vendors, savedVendors, toggleSaveVendor, addPoints, directionRequests, trackDirectionsRequest, trackChatStart, user } = useApp();

  const vendor = vendors.find(v => v.id === vendorId);
  if (!vendor) {
    return <VendorProfilePendingState onBack={onBack} />;
  }

  const isSaved = savedVendors.includes(vendor.id);
  const isBoostedVendor = vendor.subscription_tier > 1;
  const trustScore = Math.min(99, Math.round(vendor.rating * 19));
  const responseLabel = vendor.is_open ? 'Usually replies in under 5 mins' : 'Replies when back online';
  const recentVisits = Math.max(8, Math.round(vendor.rating * 11));

  // Check if directions are already unlocked or active
  const hasUnlockedDirections = directionRequests.some(
    r => r.vendorId === vendor.id && (r.status === 'verified' || r.status === 'completed')
  );

  const handleSaveToggle = () => {
    toggleSaveVendor(vendor.id);
  };

  const handleDirectionsPress = () => {
    trackDirectionsRequest(vendor.id, { actorUserId: user?.id, localityId: vendor.locality_id });
    onRequestDirections(vendor.id);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <HeaderBar 
        showBack={true} 
        onBack={onBack}
        rightComponent={
          <TouchableOpacity onPress={handleSaveToggle} style={styles.saveHeaderBtn}>
            <Ionicons 
              name={isSaved ? "heart" : "heart-outline"} 
              size={normalize(22)} 
              color={isSaved ? theme.colors.danger : theme.colors.textMain} 
            />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Vendor Banner Image */}
        <VImage source={vendor?.image || ''} style={styles.bannerImage} />

        {/* Business Title Details */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <VText variant="h1" style={styles.vendorName}>{vendor.business_name}</VText>
            <View style={[styles.statusBox, { backgroundColor: vendor.is_open ? theme.colors.primaryLight : theme.colors.border }]}>
              <VText variant="caption" color={vendor.is_open ? theme.colors.primary : theme.colors.textMuted}>
                {vendor.is_open ? 'ACTIVE' : 'OFFLINE'}
              </VText>
            </View>
          </View>

          <View style={styles.premiumSignalsRow}>
            {isBoostedVendor && (
              <View style={[styles.signalChip, styles.signalChipBoosted]}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                <VText variant="caption" color="#FFFFFF" style={{ marginLeft: 5 }}>
                  Boosted Visibility
                </VText>
              </View>
            )}
            <View style={styles.signalChip}>
              <Ionicons name="shield-checkmark" size={12} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 5 }}>
                Trust Score {trustScore}%
              </VText>
            </View>
            <View style={styles.signalChip}>
              <Ionicons name="time-outline" size={12} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 5 }}>
                {responseLabel}
              </VText>
            </View>
          </View>

          <VText variant="body" color={theme.colors.textMuted} style={styles.categoryRow}>
            {vendor.category} • {vendor.sub_category}
          </VText>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={theme.colors.warning} />
            <VText variant="h3" style={{ marginLeft: 4 }}>{vendor.rating}</VText>
            <VText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>(48 reviews)</VText>
            
            <View style={styles.verticalDivider} />
            
            <Ionicons 
              name={vendor.is_home_based ? "shield-checkmark" : "business"} 
              size={16} 
              color={theme.colors.primary} 
            />
            <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4, fontWeight: '700' }}>
              {vendor.is_home_based ? 'Home-Based Service' : 'Physical Retail Shop'}
            </VText>
          </View>

          <VText variant="body" color={theme.colors.textMuted} style={styles.bioText}>
            {vendor.bio}
          </VText>

          <View style={styles.metricsStrip}>
            <View style={styles.metricCell}>
              <VText variant="h2">{recentVisits}+</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Recent Visits</VText>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <VText variant="h2">{vendor.rating.toFixed(1)}</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Avg Rating</VText>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCell}>
              <VText variant="h2">{vendor.is_home_based ? 'Home' : 'Store'}</VText>
              <VText variant="caption" color={theme.colors.textMuted}>Service Model</VText>
            </View>
          </View>
        </View>

        <View style={[styles.transparencyCard, theme.shadows.soft]}>
          <View style={styles.guardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <VText variant="h3" style={{ marginLeft: 8 }}>Why This Vendor Appears High</VText>
          </View>
          <VText variant="body" color={theme.colors.textMuted}>
            Ranking follows customer relevance: boosted listing status, open availability, rating quality, and business consistency.
          </VText>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => Alert.alert('Ranking Policy', 'Vendors are ordered by boosted tier first, then open status, customer rating, and business name consistency. This keeps discovery fair while honoring paid visibility upgrades.')}
            style={styles.policyBtn}
          >
            <Ionicons name="help-circle-outline" size={14} color={theme.colors.primary} />
            <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6, fontWeight: '700' }}>
              VIEW FULL RANKING POLICY
            </VText>
          </TouchableOpacity>
        </View>

        {/* Location Security Protection Guard Box */}
        <View style={[styles.locationGuardBox, theme.shadows.soft]}>
          <View style={styles.guardHeader}>
            <Ionicons 
              name={vendor.is_home_based ? "shield-checkmark-outline" : "map-outline"} 
              size={20} 
              color={theme.colors.primary} 
            />
            <VText variant="h3" style={{ marginLeft: 8 }}>
              {vendor.is_home_based ? 'Fuzzy Coordinates Protection' : 'Storefront Address'}
            </VText>
          </View>

          {vendor.is_home_based ? (
            <View style={styles.guardBody}>
              <VText variant="body" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.md }}>
                This is a residential home-based vendor. To protect their physical privacy, coordinates are masked until a Visit is requested.
              </VText>
              
              {hasUnlockedDirections ? (
                <View style={styles.unlockedBox}>
                  <Ionicons name="location" size={18} color={theme.colors.accent} />
                  <VText variant="subtext" color={theme.colors.accent} style={{ marginLeft: 6 }}>
                    Exact address revealed: {vendor.street_address}
                  </VText>
                </View>
              ) : (
                <View style={styles.maskedBox}>
                  <Ionicons name="lock-closed" size={16} color={theme.colors.primary} />
                  <VText variant="subtext" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                    Exact coordinates hidden within LGA boundary circle
                  </VText>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.guardBody}>
              <VText variant="body" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.sm }}>
                Shop location is open to customers:
              </VText>
              <VText variant="h3">{vendor.street_address}</VText>
            </View>
          )}

          {/* Directions Request Action */}
          <VButton
            title={hasUnlockedDirections ? "Resume Live Navigation" : "Request Driving Directions"}
            onPress={handleDirectionsPress}
            icon="navigate-outline"
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>

        {/* Services & Products Listings */}
        <View style={styles.section}>
          <VText variant="h2" style={styles.sectionTitle}>Offered Services</VText>
          {vendor.services && vendor.services.length > 0 ? (
            vendor.services.map((service: any) => (
              <View key={service.id} style={styles.serviceItem}>
                <View style={{ flex: 1 }}>
                  <VText variant="h3">{service.title}</VText>
                  <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
                    {service.description}
                  </VText>
                  {service.price > 0 && (
                    <VText variant="caption" color={theme.colors.primary} style={{ marginTop: 3, fontWeight: '700' }}>
                      NGN {service.price.toLocaleString()}
                    </VText>
                  )}
                </View>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    addPoints(5); // points for inquiry interaction
                    trackChatStart(vendor.id, { actorUserId: user?.id, localityId: vendor.locality_id });
                    onStartChat(vendor.id);
                  }}
                  style={styles.bookBtn}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <VText variant="caption" color={theme.colors.textMuted}>
                No specific services cataloged yet. Tap chat to inquire.
              </VText>
            </View>
          )}
        </View>

        {/* Customer Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <VText variant="h2">Customer Reviews</VText>
            <TouchableOpacity onPress={() => onLeaveReview(vendor.id)}>
              <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '900' }}>
                LEAVE REVIEW
              </VText>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewCard}>
            <View style={styles.reviewUserRow}>
              <View style={styles.reviewUserLeft}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.avatarText}>AO</Text>
                </View>
                <View style={{ marginLeft: 8 }}>
                  <VText variant="h3">Adeolu O.</VText>
                  <VText variant="caption" color={theme.colors.textMuted}>2 days ago</VText>
                </View>
              </View>
              <View style={styles.reviewUserRight}>
                <Ionicons name="star" size={12} color={theme.colors.warning} />
                <VText variant="caption" style={{ marginLeft: 4 }}>5.0</VText>
              </View>
            </View>
            <VText variant="body" color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
              Amazing service! Mama Titi's Amala is outstanding, fresh and hot. The location verification was super fast. Highly recommended.
            </VText>
          </View>
        </View>

      </ScrollView>

      {/* Persistent conversion action bar */}
      <View style={[styles.bottomActionBar, theme.shadows.premium]}>
        <VButton
          title={hasUnlockedDirections ? 'Resume Navigation' : 'Request Directions'}
          onPress={handleDirectionsPress}
          icon="navigate-outline"
          style={{ flex: 1 }}
        />
        <VButton
          title="Direct Chat"
          onPress={() => {
            trackChatStart(vendor.id, { actorUserId: user?.id, localityId: vendor.locality_id });
            onStartChat(vendor.id);
          }}
          variant="secondary"
          icon="chatbubbles-outline"
          style={{ flex: 1, marginLeft: theme.spacing.sm }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  saveHeaderBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: normalize(100),
  },
  bannerImage: {
    width: '100%',
    height: normalize(180),
    backgroundColor: theme.colors.surface,
  },
  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  vendorName: {
    fontWeight: '900',
    flex: 1,
  },
  statusBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumSignalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  signalChipBoosted: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  categoryRow: {
    marginTop: 2,
    marginBottom: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  verticalDivider: {
    width: 1.5,
    height: 14,
    backgroundColor: theme.colors.border,
    marginHorizontal: 10,
  },
  bioText: {
    lineHeight: normalize(20),
  },
  metricsStrip: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: normalize(12),
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#FBFCFD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: normalize(30),
    backgroundColor: theme.colors.border,
  },
  transparencyCard: {
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  policyBtn: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.2)',
  },
  
  // Location privacy security layout
  locationGuardBox: {
    backgroundColor: theme.colors.background,
    marginHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  guardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  guardBody: {},
  maskedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: normalize(8),
    marginBottom: theme.spacing.md,
  },
  unlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Success green background
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: normalize(8),
    marginBottom: theme.spacing.md,
  },
  
  // Services
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  bookBtn: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: normalize(10),
    alignItems: 'center',
  },
  
  // Review Section
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reviewCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reviewUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  reviewUserRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Floating actions
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? normalize(32) : normalize(56),
    flexDirection: 'row',
  },
});
