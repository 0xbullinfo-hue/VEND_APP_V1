import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  Animated,
  PanResponder,
  Platform
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { uberMapStyle } from '../../theme/mapStyles';

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
  const { vendors, addPoints, locality } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null); // Starts with no selection, showing promo bar
  const [zoomScale, setZoomScale] = useState(1.0);

  const categories = [
    { name: 'All', icon: 'grid-outline' },
    { name: 'Food & Farming', icon: 'restaurant-outline' },
    { name: 'Clothing & Accessories', icon: 'shirt-outline' },
    { name: 'Repair & Construction', icon: 'construct-outline' },
    { name: 'Personal Care', icon: 'color-palette-outline' },
  ];

  // Filter vendors based on active category
  const filteredVendors = selectedCategory && selectedCategory !== 'All'
    ? vendors.filter(v => v.category === selectedCategory)
    : vendors;

  // Track the active vendor for sheet display (prevents blank card during close animation)
  const [activeVendor, setActiveVendor] = useState<any>(vendors[0]);
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(340)).current;
  const lastSnap = useRef(210);

  useEffect(() => {
    if (selectedVendorId) {
      const vendor = vendors.find(v => v.id === selectedVendorId);
      if (vendor) {
        setActiveVendor(vendor);
        setIsExpanded(false);
        lastSnap.current = 210;
        Animated.spring(translateY, {
          toValue: 210,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }).start();
      }
    } else {
      Animated.spring(translateY, {
        toValue: 360,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start(() => {
        // Keeps the activeVendor set to prevent unmounting crashes during slide-out
      });
    }
  }, [selectedVendorId]);

  const toggleExpand = () => {
    const toValue = isExpanded ? 210 : 0;
    setIsExpanded(!isExpanded);
    lastSnap.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const val = gestureState.dy;
        const currentOffset = (translateY as any)._offset;
        const projectedValue = currentOffset + val;

        // Apply resisted movement boundaries (rubber banding)
        if (projectedValue < 0) {
          translateY.setValue(val * 0.3);
        } else if (projectedValue > 250) {
          translateY.setValue(val * 0.8);
        } else {
          translateY.setValue(val);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentVal = (translateY as any)._value;

        // Toggle on tap
        if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
          toggleExpand();
          return;
        }

        let target = 210;
        let expanded = false;

        if (currentVal < 105) {
          target = 0;
          expanded = true;
        } else if (currentVal > 280) {
          target = 340;
          setSelectedVendorId(null);
        } else {
          target = 210;
          expanded = false;
        }

        setIsExpanded(expanded);
        lastSnap.current = target;

        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const handlePinPress = (id: string) => {
    setSelectedVendorId(id);
    addPoints(2); // Earning points for exploring maps!
  };

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(prev - 0.25, 0.75));
  };

  const mapRef = useRef<MapView>(null);
  
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

      {/* Interactive Map Viewport */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={uberMapStyle}
          initialRegion={initialRegion}
          onPress={() => setSelectedVendorId(null)}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {filteredVendors.map((vendor) => {
            const isSelected = selectedVendorId === vendor.id;
            const isBoosted = vendor.subscription_tier > 1;
            const coordinate = vendor.exact_location || initialRegion;
            
            let catIcon = 'storefront';
            if (vendor.category === 'Food & Farming') catIcon = 'restaurant';
            else if (vendor.category === 'Clothing & Accessories') catIcon = 'shirt';
            else if (vendor.category === 'Repair & Construction') catIcon = 'construct';
            else if (vendor.category === 'Personal Care') catIcon = 'color-palette';

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
            <VText variant="caption" color={theme.colors.primary}>EARN +20 PTS</VText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
            {vendors.map((v, index) => (
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

      {/* Selected Vendor Detail Slideup Animated Bottom Sheet */}
      {activeVendor && (
        <Animated.View 
          style={[
            styles.bottomSheet, 
            theme.shadows.premium,
            { transform: [{ translateY }] }
          ]}
        >
          {/* Drag Handle & Tap header to toggle */}
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={toggleExpand}
            {...panResponder.panHandlers}
            style={styles.sheetDragHeader}
          >
            <View style={styles.sheetHandle} />
            
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

            {/* Hint for collapsed state */}
            {!isExpanded && (
              <View style={styles.sheetHintContainer}>
                <Ionicons name="chevron-up" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
                <VText variant="caption" color={theme.colors.textMuted}>
                  Swipe up or tap to see services & bio
                </VText>
              </View>
            )}
          </TouchableOpacity>

          {/* Expanded State Details */}
          {isExpanded && (
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
          )}
        </Animated.View>
      )}
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
    top: theme.spacing.md,
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
    top: normalize(60),
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
    top: '30%',
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
});

