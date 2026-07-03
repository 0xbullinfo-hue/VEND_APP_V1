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
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { uberMapStyle } from '../../theme/mapStyles';
import { CATEGORY_CATALOG, getCategoryMeta } from '../../lib/categoryCatalog';
import { rankVendorsForCustomer } from '../../lib/vendorRanking';

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
  const { vendors, addPoints, locality, dataSource, isRealtimeConnected, isLoadingVendors } = useApp();
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

  // Filter vendors based on active category
  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const scoped = selectedCategory && selectedCategory !== 'All'
      ? vendors.filter(v => v.category === selectedCategory)
      : vendors;

    const searched = scoped.filter((v) => {
      const matchesSearch =
        normalizedQuery === '' ||
        v.business_name.toLowerCase().includes(normalizedQuery) ||
        v.category.toLowerCase().includes(normalizedQuery) ||
        v.sub_category.toLowerCase().includes(normalizedQuery);

      const matchesBoost = !onlyBoosted || v.subscription_tier > 1;
      const matchesOpen = !onlyOpen || v.is_open;
      const matchesHome = !onlyHomeBased || v.is_home_based;

      return matchesSearch && matchesBoost && matchesOpen && matchesHome;
    });

    return rankVendorsForCustomer(searched);
  }, [selectedCategory, vendors, searchQuery, onlyBoosted, onlyOpen, onlyHomeBased]);

  const promoVendors = useMemo(() => rankVendorsForCustomer(vendors), [vendors]);

  // Track the active vendor for sheet display (prevents blank card during close animation)
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
    addPoints(2); // Earning points for exploring maps!
  };

  const mapRef = useRef<MapView>(null);
  // Track the current displayed region so zoom buttons can adjust it incrementally
  const currentRegion = useRef({
    latitude: locality?.center_location?.latitude || 6.5165,
    longitude: locality?.center_location?.longitude || 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

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

  const initialRegion = {
    latitude: locality?.center_location?.latitude || 6.5165,
    longitude: locality?.center_location?.longitude || 3.3792,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <HeaderBar onPointsPress={onViewRewards} />

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
          <VText variant="caption" color={theme.colors.textMuted}>
            {isLoadingVendors
              ? 'Refreshing nearby vendors...'
              : dataSource === 'supabase' && isRealtimeConnected
              ? 'Live locality feed connected'
              : 'Using local demo dataset'}
          </VText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <VText variant="caption" color={theme.colors.primary}>
            {filteredVendors.length} visible
          </VText>
          <VText variant="caption" color={theme.colors.textMuted}>
            Boosted vendors prioritized
          </VText>
        </View>
      </View>

      {/* Interactive Map Viewport */}
      <View style={styles.mapContainer}>
        <View style={styles.discoveryRail}>
          <View style={styles.discoveryTopRow}>
            <View style={styles.localityPill}>
              <Ionicons name="location" size={14} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                {locality?.name || 'Yaba / Mainland'}
              </VText>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <VText variant="caption" color={theme.colors.textMain}>Live</VText>
            </View>
          </View>

          <View style={styles.searchRailBox}>
            <Ionicons name="search" size={18} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search vendors, categories, locality services..."
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
          </View>

          <View style={styles.priorityChipRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setOnlyBoosted((v) => !v)}
              style={[styles.priorityChip, onlyBoosted ? styles.priorityChipActive : styles.priorityChipInactive]}
            >
              <Ionicons name="sparkles" size={12} color={onlyBoosted ? '#FFFFFF' : theme.colors.primary} />
              <VText variant="caption" color={onlyBoosted ? '#FFFFFF' : theme.colors.primary} style={{ marginLeft: 4 }}>
                Boosted
              </VText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setOnlyOpen((v) => !v)}
              style={[styles.priorityChip, onlyOpen ? styles.priorityChipActive : styles.priorityChipInactive]}
            >
              <Ionicons name="radio-button-on" size={12} color={onlyOpen ? '#FFFFFF' : theme.colors.primary} />
              <VText variant="caption" color={onlyOpen ? '#FFFFFF' : theme.colors.primary} style={{ marginLeft: 4 }}>
                Open Now
              </VText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setOnlyHomeBased((v) => !v)}
              style={[styles.priorityChip, onlyHomeBased ? styles.priorityChipActive : styles.priorityChipInactive]}
            >
              <Ionicons name="home" size={12} color={onlyHomeBased ? '#FFFFFF' : theme.colors.primary} />
              <VText variant="caption" color={onlyHomeBased ? '#FFFFFF' : theme.colors.primary} style={{ marginLeft: 4 }}>
                Home-Based
              </VText>
            </TouchableOpacity>
          </View>
        </View>

        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={uberMapStyle}
          initialRegion={initialRegion}
          onPress={() => setSelectedVendorId(null)}
          onRegionChangeComplete={(region) => { currentRegion.current = region; }}
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

        {/* Floating Category Quick Filter bar */}
        <View style={styles.floatingCategoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat, i) => {
              const isSelected = selectedCategory === cat.name || (selectedCategory === null && cat.name === 'All');
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.name === 'All' ? null : cat.name)}
                  style={[
                    styles.categoryTag,
                    isSelected ? styles.tagActive : styles.tagInactive
                  ]}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={normalize(14)} 
                    color={isSelected ? theme.colors.background : theme.colors.primary} 
                    style={{ marginRight: 6 }}
                  />
                  <VText 
                    variant="caption" 
                    color={isSelected ? theme.colors.background : theme.colors.primary}
                  >
                    {cat.name}
                  </VText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Floating Explore Action Button (To category split page) */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={onExploreCategories}
          style={[styles.floatingExploreBtn, theme.shadows.premium]}
        >
          <Ionicons name="grid" size={20} color={theme.colors.background} />
          <VText variant="subtext" color={theme.colors.background} style={{ marginLeft: 8 }}>
            Browse Categories
          </VText>
        </TouchableOpacity>
      </View>

      {/* Suggested Unvisited Gems Bar (Promo) - Only visible when no vendor is selected */}
      {!selectedVendorId && (
        <View style={styles.promoBar}>
          <View style={styles.promoHeader}>
            <VText variant="h3">Unvisited Gems Nearby</VText>
            <VText variant="caption" color={theme.colors.primary}>BOOST FIRST • EARN +20 PTS</VText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
            {promoVendors.map((v) => (
              <TouchableOpacity 
                key={v.id} 
                activeOpacity={0.8}
                onPress={() => onViewVendorProfile(v.id)}
                style={[styles.promoCard, theme.shadows.soft]}
              >
                <Image source={{ uri: v.image }} style={styles.promoCardImage} />
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
            ))}
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

              {/* Popular Services Section */}
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
                  onPress={() => onViewVendorProfile(activeVendor.id)}
                  style={{ flex: 1, marginRight: 8 }}
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
  },
  dataStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF1F6',
  },
  road: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
  },
  localityCenterLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  userDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDotCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userDotPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  pinContainer: {
    position: 'absolute',
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -normalize(16) }, { translateY: -normalize(16) }], // Center coordinate
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
    borderColor: '#F59E0B', // Amber outline for premium subscription
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
  
  // Fuzzy privacy coordinates indicator styles
  pinWrapper: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -50 }, { translateY: -50 }], // Center on coordinate
  },
  fuzzyCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  fuzzyCircleActive: {
    backgroundColor: 'rgba(17, 92, 85, 0.15)',
    borderColor: theme.colors.primary,
  },
  fuzzyCircleInactive: {
    backgroundColor: 'rgba(17, 92, 85, 0.05)',
    borderColor: 'rgba(17, 92, 85, 0.3)',
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

  // Floating menus
  floatingCategoryBar: {
    position: 'absolute',
    top: normalize(132),
    left: 0,
    right: 0,
    height: normalize(38),
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: normalize(32),
    paddingHorizontal: theme.spacing.md,
    borderRadius: normalize(16),
    borderWidth: 1,
  },
  tagActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primaryLight,
  },
  gemsBanner: {
    position: 'absolute',
    bottom: normalize(130),
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(16),
    zIndex: 10,
    elevation: 10,
  },
  floatingExploreBtn: {
    position: 'absolute',
    top: normalize(176),
    right: theme.spacing.lg,
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 30,
    alignItems: 'center',
  },

  // Gems suggested banner
  promoBar: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: normalize(130),
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
    width: normalize(150),
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(10),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 4,
  },
  promoCardImage: {
    width: '100%',
    height: normalize(70),
  },
  promoCardContent: {
    padding: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  // Sheet styling
  sheetContentWrapper: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 340,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingHorizontal: theme.spacing.lg,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.primaryLight,
    zIndex: 999,
    elevation: 999,
  },
  sheetDragHeader: {
    paddingTop: theme.spacing.sm,
    paddingBottom: 6,
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
  sheetHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  sheetContent: {
    flex: 1,
    marginTop: theme.spacing.sm,
  },
  sheetBio: {
    marginBottom: theme.spacing.sm,
    lineHeight: normalize(18),
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
  sheetPrimaryBtn: {
    flex: 1,
    height: normalize(46),
    backgroundColor: theme.colors.primary,
    borderRadius: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  zoomControls: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '42%',
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    ...theme.shadows.soft
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
    gap: theme.spacing.xs,
  },
  discoveryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  localityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.14)',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
    marginRight: 6,
  },
  searchRailBox: {
    height: normalize(44),
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: normalize(14),
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
  priorityChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  priorityChipInactive: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: theme.colors.primaryLight,
  },
  tierLegendCard: {
    position: 'absolute',
    right: theme.spacing.md,
    top: normalize(238),
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 5,
    ...theme.shadows.soft,
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
});

