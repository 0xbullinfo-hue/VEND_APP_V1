import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from '../../components/MapViewCompat';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton, VSkeleton, VImage } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { uberMapStyle } from '../../theme/mapStyles';
import { CATEGORY_CATALOG, getCategoryMeta } from '../../lib/categoryCatalog';
import { rankVendorsForCustomer } from '../../lib/vendorRanking';
import { useCustomerEngagementStore } from '../../store/useCustomerEngagementStore';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onExploreCategories: () => void;
  onViewVendorProfile: (vendorId: string) => void;
  onViewRewards: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onExploreCategories, 
  onViewVendorProfile,
  onViewRewards
}) => {
  const { vendors, addPoints, locality, dataSource, isRealtimeConnected, isLoadingVendors, trackProfileView, user } = useApp();
  const engagementStore = useCustomerEngagementStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null); // Starts with no selection, showing promo bar
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBoosted, setOnlyBoosted] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [onlyHomeBased, setOnlyHomeBased] = useState(false);

  const categories = useMemo(
    () => [
      { name: 'All', icon: 'grid-outline' },
      ...CATEGORY_CATALOG.map((item) => ({ name: item.name, icon: item.icon })),
    ],
    []
  );

  const initialRegion = {
    latitude: locality?.center_location?.latitude || 6.5165,
    longitude: locality?.center_location?.longitude || 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const [visibleRegion, setVisibleRegion] = useState(initialRegion);

  // Filter vendors based on active category and map bounds
  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const scoped = selectedCategory && selectedCategory !== 'All'
      ? vendors.filter(v => v.category === selectedCategory)
      : vendors;

    return scoped.filter((v) => {
      // 1. Basic Filters
      const matchesSearch =
        normalizedQuery === '' ||
        v.business_name.toLowerCase().includes(normalizedQuery) ||
        v.category.toLowerCase().includes(normalizedQuery) ||
        v.sub_category.toLowerCase().includes(normalizedQuery);

      const matchesBoost = !onlyBoosted || v.subscription_tier > 1;
      const matchesOpen = !onlyOpen || v.is_open;
      const matchesHome = !onlyHomeBased || v.is_home_based;

      if (!(matchesSearch && matchesBoost && matchesOpen && matchesHome)) return false;

      // 2. Bound Filtering (Large Usage Optimization)
      const buffer = visibleRegion.latitudeDelta;
      const inLat = v.exact_location.latitude > visibleRegion.latitude - visibleRegion.latitudeDelta - buffer &&
                    v.exact_location.latitude < visibleRegion.latitude + visibleRegion.latitudeDelta + buffer;
      const inLng = v.exact_location.longitude > visibleRegion.longitude - visibleRegion.longitudeDelta - buffer &&
                    v.exact_location.longitude < visibleRegion.longitude + visibleRegion.longitudeDelta + buffer;

      return inLat && inLng;
    });
  }, [selectedCategory, vendors, searchQuery, onlyBoosted, onlyOpen, onlyHomeBased, visibleRegion]);

  const promoVendors = useMemo(() => rankVendorsForCustomer(vendors), [vendors]);

  // Track the active vendor for sheet display
  const [activeVendor, setActiveVendor] = useState<typeof vendors[number] | null>(vendors[0] ?? null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '45%'], []);

  useEffect(() => {
    if (selectedVendorId) {
      const vendor = vendors.find(v => v.id === selectedVendorId);
      if (vendor) {
        setActiveVendor(vendor);
        bottomSheetRef.current?.snapToIndex(0);
      }
    } else {
      bottomSheetRef.current?.close();
    }
  }, [selectedVendorId, vendors]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedVendorId(null);
    }
  }, []);

  const handlePinPress = (id: string) => {
    setSelectedVendorId(id);
    addPoints(2);
    
    const vendor = vendors.find(v => v.id === id);
    if (vendor) {
      engagementStore.recordVendorInteraction(id, 'view', 0);
      engagementStore.addBrowsingEvent({
        vendorId: id,
        vendorName: vendor.business_name,
        category: vendor.category,
        durationSeconds: 10,
        interactionType: 'view',
      });
    }
  };

  const mapRef = useRef<MapView>(null);
  const currentRegion = useRef(initialRegion);

  const handleZoomIn = () => {
    const next = {
      ...currentRegion.current,
      latitudeDelta: Math.max(currentRegion.current.latitudeDelta / 2, 0.002),
      longitudeDelta: Math.max(currentRegion.current.longitudeDelta / 2, 0.002),
    };
    currentRegion.current = next;
    mapRef.current?.animateToRegion(next, 300);
  };

  const handleZoomOut = () => {
    const next = {
      ...currentRegion.current,
      latitudeDelta: Math.min(currentRegion.current.latitudeDelta * 2, 0.5),
      longitudeDelta: Math.min(currentRegion.current.longitudeDelta * 2, 0.5),
    };
    currentRegion.current = next;
    mapRef.current?.animateToRegion(next, 300);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <HeaderBar
        onPointsPress={onViewRewards}
        rightComponent={
          <TouchableOpacity onPress={onExploreCategories} style={styles.headerExploreBtn}>
            <Ionicons name="grid-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.dataStatusBar}>
        <View style={styles.dataStatusLeft}>
          <View
            style={[
              styles.dataStatusDot,
              {
                backgroundColor:
                  dataSource === 'supabase' && isRealtimeConnected
                    ? theme.colors.accent
                    : theme.colors.warning,
              },
            ]}
          />
          {isLoadingVendors ? (
            <VSkeleton width={140} height={14} borderRadius={4} />
          ) : (
            <VText variant="caption" color={theme.colors.textMuted}>
              {dataSource === 'supabase' && isRealtimeConnected
                ? 'Live locality feed connected'
                : 'Using local demo dataset'}
            </VText>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                'Ranking Policy',
                'Boosted vendors are shown first, then open status, rating, and business name consistency.'
              )
            }
            style={styles.rankingPolicyPill}
          >
            <Ionicons name="information-circle-outline" size={12} color={theme.colors.primary} />
            <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>
              Ranking Info
            </VText>
          </TouchableOpacity>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {isLoadingVendors ? (
            <VSkeleton width={60} height={14} borderRadius={4} />
          ) : (
            <>
              <VText variant="caption" color={theme.colors.primary}>
                {filteredVendors.length} visible
              </VText>
              <VText variant="caption" color={theme.colors.textMuted}>
                Boosted prioritized
              </VText>
            </>
          )}
        </View>
      </View>

      {/* Interactive Map Viewport */}
      <View style={styles.mapContainer}>
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.discoveryRail}>
          {/* Top Search Bar */}
          <View style={styles.searchRailBox}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search local services & vendors..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchRailInput, { fontFamily: theme.typography.fontSans }]}
            />
            {searchQuery ? (
              <TouchableOpacity activeOpacity={0.8} onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.vDivider} />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Quick Filters',
                  'Select filters to narrow your search:',
                  [
                    { text: onlyBoosted ? '✓ Boosted Only' : 'Boosted Only', onPress: () => setOnlyBoosted(!onlyBoosted) },
                    { text: onlyOpen ? '✓ Open Now' : 'Open Now', onPress: () => setOnlyOpen(!onlyOpen) },
                    { text: onlyHomeBased ? '✓ Home-Based' : 'Home-Based', onPress: () => setOnlyHomeBased(!onlyHomeBased) },
                    { text: 'Close', style: 'cancel' }
                  ]
                );
              }}
              style={styles.filterTrigger}
            >
              <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Integrated Category Bar (Right under search) */}
          <View style={styles.integratedCategoryBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat, index) => {
                const isSelected = selectedCategory === cat.name || (selectedCategory === null && cat.name === 'All');
                return (
                  <Animated.View
                    key={cat.name}
                    entering={FadeInRight.delay(400 + (index * 50)).duration(400)}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedCategory(cat.name === 'All' ? null : cat.name)}
                      style={[
                        styles.categoryTag,
                        isSelected ? styles.tagActive : styles.tagInactive
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={normalize(13)}
                        color={isSelected ? theme.colors.background : theme.colors.primary}
                        style={{ marginRight: 4 }}
                      />
                      <VText
                        variant="caption"
                        color={isSelected ? theme.colors.background : theme.colors.primary}
                        style={{ fontSize: normalize(11) }}
                      >
                        {cat.name}
                      </VText>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>

        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={uberMapStyle}
          initialRegion={initialRegion}
          onPress={() => setSelectedVendorId(null)}
          onRegionChangeComplete={(region) => {
            currentRegion.current = region;
            if (Math.abs(region.latitudeDelta - visibleRegion.latitudeDelta) > visibleRegion.latitudeDelta * 0.1 ||
                Math.abs(region.latitude - visibleRegion.latitude) > visibleRegion.latitudeDelta * 0.1) {
              setVisibleRegion(region);
            }
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {filteredVendors.map((vendor) => {
            const isSelected = selectedVendorId === vendor.id;
            const isBoosted = vendor.subscription_tier > 1;
            const coordinate = vendor.exact_location || initialRegion;
            const { icon } = getCategoryMeta(vendor.category);
            const catIcon = icon.replace('-outline', '');

            if (vendor.is_home_based) {
              return (
                <React.Fragment key={vendor.id}>
                  <Circle
                    center={coordinate}
                    radius={300}
                    fillColor={isSelected ? 'rgba(17, 92, 85, 0.15)' : 'rgba(17, 92, 85, 0.05)'}
                    strokeColor={isSelected ? theme.colors.primary : 'rgba(17, 92, 85, 0.3)'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <Marker
                    coordinate={coordinate}
                    onPress={() => handlePinPress(vendor.id)}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={[
                      styles.pinIcon,
                      isSelected ? styles.pinIconActive : styles.pinIconInactive,
                      isBoosted && styles.boostedPin
                    ]}>
                      <Ionicons 
                        name="home" 
                        size={normalize(12)} 
                        color={isSelected ? theme.colors.background : theme.colors.primary} 
                      />
                    </View>
                  </Marker>
                </React.Fragment>
              );
            }

            return (
              <Marker
                key={vendor.id}
                coordinate={coordinate}
                onPress={() => handlePinPress(vendor.id)}
                anchor={{ x: 0.5, y: 0.5 }}
                style={{ zIndex: isSelected ? 10 : 1 }}
              >
                <View style={[
                  styles.pinContainer,
                  isSelected ? styles.pinActive : styles.pinInactive,
                  isBoosted && styles.boostedPin,
                  theme.shadows.glow
                ]}>
                  <Ionicons 
                    name={catIcon as any} 
                    size={normalize(14)} 
                    color={isSelected ? theme.colors.background : theme.colors.primary} 
                  />
                  {isBoosted && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="sparkles" size={6} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Floating Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleZoomIn} style={styles.zoomBtn}>
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity activeOpacity={0.8} onPress={handleZoomOut} style={styles.zoomBtn}>
            <Ionicons name="remove" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.tierLegendCard}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <VText variant="caption" color={theme.colors.textMain}>Boosted</VText>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
            <VText variant="caption" color={theme.colors.textMain}>Verified</VText>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#6B7280' }]} />
            <VText variant="caption" color={theme.colors.textMain}>Home-Based</VText>
          </View>
        </View>
      </View>

      {/* Suggested Unvisited Gems Bar (Promo) - Only visible when no vendor is selected */}
      {!selectedVendorId && (
        <View style={styles.promoBar}>
          <View style={styles.promoHeader}>
            <VText variant="h3">Unvisited Gems Nearby</VText>
            <VText variant="caption" color={theme.colors.primary}>BOOST FIRST • EARN +20 PTS</VText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
            {isLoadingVendors ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.promoCard}>
                  <VSkeleton width="100%" height={80} borderRadius={0} />
                  <View style={{ padding: theme.spacing.md, gap: 8 }}>
                    <VSkeleton width="80%" height={14} />
                    <VSkeleton width="40%" height={10} />
                  </View>
                </View>
              ))
            ) : (
              promoVendors.map((v, index) => (
                <Animated.View
                  key={v.id}
                  entering={FadeInRight.delay(100 * index).duration(500)}
                  layout={Layout.springify()}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      trackProfileView(v.id, { actorUserId: user?.id, localityId: v.locality_id });
                      engagementStore.recordVendorInteraction(v.id, 'view', 0);
                      engagementStore.addBrowsingEvent({
                        vendorId: v.id,
                        vendorName: v.business_name,
                        category: v.category,
                        durationSeconds: 15,
                        interactionType: 'view',
                      });
                      onViewVendorProfile(v.id);
                    }}
                    style={[styles.promoCard, theme.shadows.soft]}
                  >
                    <VImage source={v.image} style={styles.promoCardImage} />
                    <View style={styles.promoCardContent}>
                      <VText variant="subtext" numberOfLines={1}>{v.business_name}</VText>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={10} color={theme.colors.warning} />
                        <VText variant="caption" style={{ marginLeft: 4 }}>{v.rating}</VText>
                        <VText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>
                          {v.is_home_based ? 'Home-Based' : 'Physical Shop'}
                        </VText>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Selected Vendor Detail Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={handleSheetChanges}
        backgroundStyle={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: normalize(24),
          borderTopRightRadius: normalize(24),
          borderTopWidth: 1.5,
          borderTopColor: theme.colors.primaryLight,
        }}
        handleIndicatorStyle={styles.sheetHandle}
      >
        {activeVendor && (
          <BottomSheetView style={styles.sheetContentWrapper}>
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <VText variant="h2" numberOfLines={1}>{activeVendor.business_name}</VText>
                  {activeVendor.subscription_tier > 1 && (
                    <View style={styles.sheetPremiumBadge}>
                      <Ionicons name="sparkles" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                      <VText variant="caption" color="#FFFFFF">BOOSTED</VText>
                    </View>
                  )}
                </View>
                <VText variant="caption" color={theme.colors.textMuted}>
                  {activeVendor.category} • {activeVendor.sub_category}
                </VText>
              </View>
              
              <View style={styles.sheetStatusContainer}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: activeVendor.is_open ? theme.colors.accent : theme.colors.textMuted }
                ]} />
                <VText variant="caption" color={activeVendor.is_open ? theme.colors.accent : theme.colors.textMuted}>
                  {activeVendor.is_open ? 'ONLINE' : 'OFFLINE'}
                </VText>
              </View>
            </View>

            <View style={styles.sheetContent}>
              <VText variant="body" color={theme.colors.textMuted} numberOfLines={2} style={styles.sheetBio}>
                {activeVendor.bio}
              </VText>

              <View style={styles.rankReasonRow}>
                <View style={activeVendor.subscription_tier > 1 ? [styles.rankReasonChip, styles.rankReasonBoosted] : styles.rankReasonChip}>
                  <Ionicons name={activeVendor.subscription_tier > 1 ? 'sparkles' : 'medal-outline'} size={11} color={activeVendor.subscription_tier > 1 ? "#FFFFFF" : theme.colors.primary} />
                  <VText variant="caption" color={activeVendor.subscription_tier > 1 ? "#FFFFFF" : theme.colors.primary} style={{ marginLeft: 4 }}>
                    {activeVendor.subscription_tier > 1 ? 'Ranked for Boost Priority' : 'Ranked by Quality Signals'}
                  </VText>
                </View>

                <View style={styles.rankReasonChip}>
                  <Ionicons name={activeVendor.is_open ? 'radio-button-on' : 'pause-circle-outline'} size={11} color={theme.colors.primary} />
                  <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>
                    {activeVendor.is_open ? 'Open Right Now' : 'Currently Offline'}
                  </VText>
                </View>
              </View>

              <View style={styles.servicesContainer}>
                <VText variant="caption" color={theme.colors.textMuted} style={{ fontWeight: '700', marginBottom: 6 }}>
                  POPULAR SERVICES
                </VText>
                <View style={styles.servicesRow}>
                  {activeVendor.services?.slice(0, 2).map((s: any) => (
                    <View key={s.id} style={styles.serviceTag}>
                      <Ionicons name="checkmark-circle-outline" size={12} color={theme.colors.primary} style={{ marginRight: 4 }} />
                      <VText variant="caption" color={theme.colors.primary} numberOfLines={1} style={{ maxWidth: normalize(120) }}>
                        {s.title}
                      </VText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.sheetActions}>
                <VButton
                  title="View Vendor Profile"
                  onPress={() => {
                    trackProfileView(activeVendor.id, { actorUserId: user?.id, localityId: activeVendor.locality_id });
                    engagementStore.recordVendorInteraction(activeVendor.id, 'view', 0);
                    engagementStore.addBrowsingEvent({
                      vendorId: activeVendor.id,
                      vendorName: activeVendor.business_name,
                      category: activeVendor.category,
                      durationSeconds: 20,
                      interactionType: 'view',
                    });
                    onViewVendorProfile(activeVendor.id);
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </BottomSheetView>
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E5E9F0',
  },
  dataStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: '#FCFCFC',
  },
  dataStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dataStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  rankingPolicyPill: {
    marginLeft: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FAFC',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  pinContainer: {
    position: 'absolute',
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -normalize(16) }, { translateY: -normalize(16) }],
  },
  pinActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.background,
    borderWidth: 2,
  },
  pinInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  boostedPin: {
    shadowColor: '#115C55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  pinIconActive: {
    backgroundColor: theme.colors.primary,
  },
  pinIconInactive: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  integratedCategoryBar: {
    marginTop: theme.spacing.sm,
    height: normalize(32),
  },
  categoryScroll: {
    paddingHorizontal: 2,
    gap: theme.spacing.xs,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(28),
    paddingHorizontal: theme.spacing.md,
    borderRadius: normalize(14),
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagInactive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: theme.colors.primaryLight,
  },
  promoBar: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: normalize(20),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  promoScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  promoCard: {
    width: normalize(160),
    backgroundColor: theme.colors.background,
    borderRadius: normalize(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    marginBottom: 8,
  },
  promoCardImage: {
    width: '100%',
    height: normalize(80),
    backgroundColor: theme.colors.surface,
  },
  promoCardContent: {
    padding: theme.spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sheetContentWrapper: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sheetHandle: {
    width: normalize(40),
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sheetPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  sheetStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sheetBio: {
    marginBottom: theme.spacing.sm,
    lineHeight: normalize(18),
  },
  sheetContent: {
    flex: 1,
    marginTop: theme.spacing.sm,
  },
  rankReasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  rankReasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  rankReasonBoosted: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  servicesContainer: {
    marginBottom: theme.spacing.md,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.1)',
  },
  sheetActions: {
    flexDirection: 'row',
    marginTop: 'auto',
    marginBottom: theme.spacing.lg,
  },
  zoomControls: {
    position: 'absolute',
    right: theme.spacing.md,
    top: normalize(150),
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    ...theme.shadows.soft,
    zIndex: 11,
  },
  zoomBtn: {
    padding: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: normalize(8),
  },
  discoveryRail: {
    position: 'absolute',
    top: theme.spacing.sm,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 12,
  },
  searchRailBox: {
    height: normalize(46),
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  searchRailInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.textMain,
    fontSize: normalize(13),
  },
  vDivider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.border,
    marginHorizontal: 10,
  },
  filterTrigger: {
    padding: 4,
  },
  tierLegendCard: {
    position: 'absolute',
    left: theme.spacing.md,
    top: normalize(150),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 4,
    ...theme.shadows.soft,
    zIndex: 11,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerExploreBtn: {
    padding: 6,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
});
