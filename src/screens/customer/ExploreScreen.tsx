import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { CATEGORY_CATALOG } from '../../lib/categoryCatalog';
import { rankVendorsForCustomer } from '../../lib/vendorRanking';

interface ExploreScreenProps {
  onBackToHome: () => void;
  onViewVendorProfile: (vendorId: string) => void;
  onViewRewards: () => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ 
  onBackToHome,
  onViewVendorProfile,
  onViewRewards
}) => {
  const { vendors, addPoints, locality, isRealtimeConnected, dataSource } = useApp();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'grid'>('grid');
  const [onlyBoosted, setOnlyBoosted] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(true);

  const activeCategory = CATEGORY_CATALOG[activeCategoryIndex];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredVendors = useMemo(
    () => {
      const scoped = vendors.filter((v) => {
        const matchesSearch =
          normalizedQuery === '' ||
          v.business_name.toLowerCase().includes(normalizedQuery) ||
          v.bio.toLowerCase().includes(normalizedQuery);

        const matchesBoost = !onlyBoosted || v.subscription_tier > 1;
        const matchesOpen = !onlyOpen || v.is_open;

        if (selectedSubcategory) {
          return v.sub_category === selectedSubcategory && matchesSearch && matchesBoost && matchesOpen;
        }

        return v.category === activeCategory.name && matchesSearch && matchesBoost && matchesOpen;
      });
      return rankVendorsForCustomer(scoped);
    },
    [activeCategory.name, normalizedQuery, onlyBoosted, onlyOpen, selectedSubcategory, vendors]
  );

  const handleCategoryPress = (index: number) => {
    setActiveCategoryIndex(index);
    setSelectedSubcategory(null);
    addPoints(2); // Earn points for browsing
  };

  const handleSubcategoryPress = (subName: string) => {
    setSelectedSubcategory(subName === selectedSubcategory ? null : subName);
    addPoints(2); // Earn points for narrowing down
  };

  const renderVendors = () => {
    if (filteredVendors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={normalize(48)} color={theme.colors.textMuted} />
          <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginTop: theme.spacing.sm }}>
            No active vendors found in this category right now.
          </VText>
        </View>
      );
    }

    return filteredVendors.map((vendor) => {
      const isPremium = vendor.subscription_tier > 1;
      return (
        <TouchableOpacity
          key={vendor.id}
          activeOpacity={0.85}
          onPress={() => onViewVendorProfile(vendor.id)}
          style={[
            styles.vendorResultCard,
            isPremium ? styles.cardPremium : styles.cardNormal,
            theme.shadows.soft,
          ]}
        >
          <Image source={{ uri: vendor.image }} style={styles.vendorCardImg} />
          <View style={styles.vendorCardInfo}>
            <View style={styles.vendorTitleRow}>
              <VText variant="h3" numberOfLines={1} style={{ maxWidth: '70%' }}>
                {vendor.business_name}
              </VText>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="sparkles" size={8} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <VText variant="caption" color="#FFFFFF" style={{ fontSize: normalize(8) }}>
                    BOOSTED
                  </VText>
                </View>
              )}
            </View>

            <VText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
              {vendor.sub_category} • {vendor.is_home_based ? 'Home-Based' : 'Physical Shop'}
            </VText>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={normalize(12)} color={theme.colors.warning} />
              <VText variant="caption" style={{ marginLeft: 4 }}>
                {vendor.rating}
              </VText>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: vendor.is_open ? theme.colors.accent : theme.colors.textMuted },
                ]}
              />
              <VText
                variant="caption"
                color={vendor.is_open ? theme.colors.accent : theme.colors.textMuted}
                style={{ fontSize: 9 }}
              >
                {vendor.is_open ? 'ONLINE' : 'OFFLINE'}
              </VText>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderGridMode = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gridModeContent}>
        <View style={styles.gridCategoryWrap}>
          {CATEGORY_CATALOG.map((cat, idx) => {
            const isActive = idx === activeCategoryIndex;
            return (
              <TouchableOpacity
                key={cat.name}
                activeOpacity={0.85}
                onPress={() => handleCategoryPress(idx)}
                style={[styles.gridCategoryCard, isActive && styles.gridCategoryCardActive]}
              >
                <View style={[styles.gridIconShell, { backgroundColor: isActive ? '#FFFFFF' : cat.color }]}>
                  <Ionicons
                    name={cat.icon as any}
                    size={normalize(20)}
                    color={theme.colors.primary}
                  />
                </View>
                <VText
                  variant="subtext"
                  align="center"
                  color={isActive ? '#FFFFFF' : theme.colors.textMain}
                  style={styles.gridCategoryText}
                >
                  {cat.name}
                </VText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.subcategoryBarGridMode}>
          <VText variant="h3" style={{ marginBottom: theme.spacing.sm }}>
            {activeCategory.name}
          </VText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTagScroll}>
            {activeCategory.subcategories.map((sub) => {
              const isSelected = selectedSubcategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  activeOpacity={0.8}
                  onPress={() => handleSubcategoryPress(sub)}
                  style={[styles.subTag, isSelected ? styles.subTagActive : styles.subTagInactive]}
                >
                  <VText variant="caption" color={isSelected ? theme.colors.background : theme.colors.primary}>
                    {sub}
                  </VText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.resultsHeader}>
          <View>
            <VText variant="caption" color={theme.colors.textMuted}>
              {filteredVendors.length} VENDORS FOUND
            </VText>
            <VText variant="caption" color={theme.colors.primary}>
              Boosted profiles prioritized in your locality
            </VText>
          </View>
        </View>
        {renderVendors()}
      </ScrollView>
    );
  };

  const renderSplitMode = () => {
    return (
      <View style={styles.splitPaneContainer}>
        <View style={styles.leftPane}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.leftScroll}>
            {CATEGORY_CATALOG.map((cat, idx) => {
              const isActive = activeCategoryIndex === idx;
              return (
                <TouchableOpacity
                  key={cat.name}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(idx)}
                  style={[styles.categoryMenuItem, isActive ? styles.itemActive : styles.itemInactive]}
                >
                  <View style={[styles.iconBox, { backgroundColor: isActive ? theme.colors.background : cat.color }]}>
                    <Ionicons name={cat.icon as any} size={normalize(18)} color={theme.colors.primary} />
                  </View>
                  <VText
                    variant="caption"
                    align="center"
                    color={isActive ? theme.colors.background : theme.colors.textMain}
                    style={styles.categoryMenuText}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </VText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.rightPane}>
          <View style={styles.subcategoryBar}>
            <VText variant="h3" style={{ marginBottom: theme.spacing.sm }}>
              {activeCategory.name}
            </VText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTagScroll}>
              {activeCategory.subcategories.map((sub) => {
                const isSelected = selectedSubcategory === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    activeOpacity={0.8}
                    onPress={() => handleSubcategoryPress(sub)}
                    style={[styles.subTag, isSelected ? styles.subTagActive : styles.subTagInactive]}
                  >
                    <VText variant="caption" color={isSelected ? theme.colors.background : theme.colors.primary}>
                      {sub}
                    </VText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultsScroll}>
            <View style={styles.resultsHeader}>
              <View>
                <VText variant="caption" color={theme.colors.textMuted}>
                  {filteredVendors.length} VENDORS FOUND
                </VText>
                <VText variant="caption" color={theme.colors.primary}>
                  Boosted profiles prioritized in your locality
                </VText>
              </View>
            </View>
            {renderVendors()}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar 
        title="Explore" 
        showBack={true} 
        onBack={onBackToHome} 
        onPointsPress={onViewRewards} 
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchFieldBox}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search tailored services, plumbing, foods..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.length % 3 === 0 && text.length > 0) addPoints(1);
            }}
            style={[styles.searchInput, { fontFamily: theme.typography.fontSans }]}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.discoveryMetaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="location" size={12} color={theme.colors.primary} />
            <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 5 }}>
              {locality?.name || 'Yaba / Mainland'}
            </VText>
          </View>
          <View style={styles.metaPill}>
            <View style={[styles.feedDot, { backgroundColor: isRealtimeConnected ? theme.colors.accent : theme.colors.warning }]} />
            <VText variant="caption" color={theme.colors.textMain}>
              {dataSource === 'supabase' && isRealtimeConnected ? 'Live Feed' : 'Demo Feed'}
            </VText>
          </View>
        </View>

        <View style={styles.quickFilterRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setOnlyBoosted((value) => !value)}
            style={[styles.quickFilterChip, onlyBoosted ? styles.quickFilterChipActive : styles.quickFilterChipInactive]}
          >
            <Ionicons name="sparkles" size={12} color={onlyBoosted ? '#FFFFFF' : theme.colors.primary} />
            <VText variant="caption" color={onlyBoosted ? '#FFFFFF' : theme.colors.primary} style={{ marginLeft: 5 }}>
              Boosted
            </VText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setOnlyOpen((value) => !value)}
            style={[styles.quickFilterChip, onlyOpen ? styles.quickFilterChipActive : styles.quickFilterChipInactive]}
          >
            <Ionicons name="radio-button-on" size={12} color={onlyOpen ? '#FFFFFF' : theme.colors.primary} />
            <VText variant="caption" color={onlyOpen ? '#FFFFFF' : theme.colors.primary} style={{ marginLeft: 5 }}>
              Open Now
            </VText>
          </TouchableOpacity>
        </View>

        <View style={styles.priorityLegendCard}>
          <VText variant="caption" color={theme.colors.textMuted}>RANKING ORDER</VText>
          <VText variant="caption" color={theme.colors.textMain} style={{ marginTop: 2 }}>
            Boosted first, then open status, rating, and name.
          </VText>
        </View>

        <View style={styles.modeSwitchRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setViewMode('grid')}
            style={[styles.modeChip, viewMode === 'grid' ? styles.modeChipActive : styles.modeChipInactive]}
          >
            <Ionicons
              name="grid-outline"
              size={normalize(14)}
              color={viewMode === 'grid' ? '#FFFFFF' : theme.colors.primary}
            />
            <VText
              variant="caption"
              color={viewMode === 'grid' ? '#FFFFFF' : theme.colors.primary}
              style={{ marginLeft: 6 }}
            >
              Grid
            </VText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setViewMode('split')}
            style={[styles.modeChip, viewMode === 'split' ? styles.modeChipActive : styles.modeChipInactive]}
          >
            <Ionicons
              name="list-outline"
              size={normalize(14)}
              color={viewMode === 'split' ? '#FFFFFF' : theme.colors.primary}
            />
            <VText
              variant="caption"
              color={viewMode === 'split' ? '#FFFFFF' : theme.colors.primary}
              style={{ marginLeft: 6 }}
            >
              Split
            </VText>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'grid' ? renderGridMode() : renderSplitMode()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchFieldBox: {
    height: normalize(42),
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.textMain,
    fontSize: normalize(13),
  },
  modeSwitchRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  discoveryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: theme.spacing.xs,
  },
  feedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  quickFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: theme.spacing.xs,
  },
  quickFilterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quickFilterChipInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primaryLight,
  },
  priorityLegendCard: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.12)',
    borderRadius: normalize(12),
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  modeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  modeChipInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primaryLight,
  },

  gridModeContent: {
    padding: theme.spacing.md,
    paddingBottom: normalize(120),
  },
  gridCategoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  gridCategoryCard: {
    width: '48.5%',
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#F9FAFB',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  gridCategoryCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.soft,
  },
  gridIconShell: {
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridCategoryText: {
    fontSize: normalize(11),
    fontWeight: '700',
  },
  subcategoryBarGridMode: {
    paddingVertical: theme.spacing.sm,
  },
  
  // Split pane layout
  splitPaneContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Left Sidebar: Categories selection
  leftPane: {
    width: normalize(90),
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1.5,
    borderRightColor: theme.colors.border,
  },
  leftScroll: {
    paddingTop: theme.spacing.xs,
    paddingBottom: normalize(120),
  },
  categoryMenuItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  itemActive: {
    backgroundColor: theme.colors.primary,
  },
  itemInactive: {
    backgroundColor: 'transparent',
  },
  iconBox: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryMenuText: {
    fontSize: normalize(9),
    fontWeight: '700',
    lineHeight: 11,
  },

  // Right Side: Subcategories & Vendors
  rightPane: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  subcategoryBar: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subTagScroll: {
    gap: theme.spacing.xs,
    paddingBottom: 4,
  },
  subTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  subTagActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subTagInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.primaryLight,
  },
  
  // Results Scroll
  resultsScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: normalize(120),
  },
  resultsHeader: {
    marginVertical: theme.spacing.sm,
  },
  vendorResultCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: normalize(12),
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  cardNormal: {
    borderColor: theme.colors.border,
  },
  cardPremium: {
    borderColor: '#F59E0B', // Premium Amber card border
    borderWidth: 1.5,
  },
  vendorCardImg: {
    width: normalize(75),
    height: normalize(75),
    backgroundColor: theme.colors.surface,
  },
  vendorCardInfo: {
    flex: 1,
    padding: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  vendorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 10,
    marginRight: 4,
  },
  emptyContainer: {
    paddingVertical: normalize(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
