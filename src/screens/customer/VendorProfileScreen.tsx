import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  Text,
  Platform
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, HeaderBar } from '../../components/SharedComponents';
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
  const { vendors, savedVendors, toggleSaveVendor, addPoints, directionRequests } = useApp();

  const vendor = vendors.find(v => v.id === vendorId);
  if (!vendor) {
    return (
      <View style={styles.container}>
        <HeaderBar showBack={true} onBack={onBack} />
        <View style={[styles.section, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="alert-circle-outline" size={normalize(42)} color={theme.colors.warning} style={{ marginBottom: theme.spacing.sm }} />
          <VText variant="h2" align="center" style={{ marginBottom: theme.spacing.xs }}>
            Vendor Not Found
          </VText>
          <VText variant="body" align="center" color={theme.colors.textMuted}>
            This vendor is no longer available in your current locality feed.
          </VText>
          <VButton
            title="Back"
            onPress={onBack}
            style={{ marginTop: theme.spacing.lg, width: '100%' }}
          />
        </View>
      </View>
    );
  }

  const isSaved = savedVendors.includes(vendor.id);

  // Check if directions are already unlocked or active
  const hasUnlockedDirections = directionRequests.some(
    r => r.vendorId === vendor.id && (r.status === 'verified' || r.status === 'completed')
  );

  const handleSaveToggle = () => {
    toggleSaveVendor(vendor.id);
  };

  const handleDirectionsPress = () => {
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
        <Image source={{ uri: vendor.image }} style={styles.bannerImage} />

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
                </View>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    addPoints(5); // points for inquiry interaction
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

      {/* Persistent floating contact/chat action bar */}
      <View style={[styles.bottomActionBar, theme.shadows.premium]}>
        <VButton
          title="Direct Chat"
          onPress={() => onStartChat(vendor.id)}
          variant="secondary"
          icon="chatbubbles-outline"
          style={{ flex: 1 }}
        />
        <VButton
          title="Emergency SOS"
          onPress={() => {
            Alert.alert("Emergency Alert", "Trigger SOS beacon to emergency watch centers?", [
              { text: "Cancel", style: "cancel" },
              { text: "Send SOS", style: "destructive", onPress: () => addPoints(10) }
            ]);
          }}
          variant="danger"
          icon="alert-circle-outline"
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
