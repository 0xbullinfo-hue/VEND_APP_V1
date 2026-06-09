import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Image
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar } from '../../components/SharedComponents';
import { MOCK_CATEGORIES } from '../../lib/supabase';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

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
  const { vendors, addPoints } = useApp();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const activeCategory = MOCK_CATEGORIES[activeCategoryIndex];

  // List of vendors matching selected subcategory
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = searchQuery.trim() === '' || 
      v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.bio.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (selectedSubcategory) {
      return v.sub_category === selectedSubcategory && matchesSearch;
    }
    
    return v.category === activeCategory.name && matchesSearch;
  });

  const handleCategoryPress = (index: number) => {
    setActiveCategoryIndex(index);
    setSelectedSubcategory(null);
    addPoints(2); // Earn points for browsing
  };

  const handleSubcategoryPress = (subName: string) => {
    setSelectedSubcategory(subName === selectedSubcategory ? null : subName);
    addPoints(2); // Earn points for narrowing down
  };

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <HeaderBar 
        title="Explore" 
        showBack={true} 
        onBack={onBackToHome} 
        onPointsPress={onViewRewards} 
      />
      
      {/* Local Search Input Area */}
      <View style={styles.searchContainer}>
        <View style={styles.searchFieldBox}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search tailored services, plumbing, foods..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if(text.length % 3 === 0 && text.length > 0) addPoints(1); // Small points reward for query search engagement
            }}
            style={[styles.searchInput, { fontFamily: theme.typography.fontSans }]}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Split Pane Layout (Adopted from 2clicks.ng UI/UX) */}
      <View style={styles.splitPaneContainer}>
        
        {/* Left Sidebar Pane: Main Categories list */}
        <View style={styles.leftPane}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.leftScroll}
          >
            {MOCK_CATEGORIES.map((cat, idx) => {
              const isActive = activeCategoryIndex === idx;
              return (
                <TouchableOpacity
                  key={cat.name}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(idx)}
                  style={[
                    styles.categoryMenuItem,
                    isActive ? styles.itemActive : styles.itemInactive
                  ]}
                >
                  <View style={[
                    styles.iconBox, 
                    { backgroundColor: isActive ? theme.colors.background : cat.color }
                  ]}>
                    <Ionicons 
                      name={cat.icon as any} 
                      size={normalize(18)} 
                      color={theme.colors.primary} 
                    />
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

        {/* Right Content Pane: Subcategories and matching results */}
        <View style={styles.rightPane}>
          {/* Subcategories Horizontal Scroll Filter Tags */}
          <View style={styles.subcategoryBar}>
            <VText variant="h3" style={{ marginBottom: theme.spacing.sm }}>
              {activeCategory.name}
            </VText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subTagScroll}
            >
              {activeCategory.subcategories.map((sub) => {
                const isSelected = selectedSubcategory === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    activeOpacity={0.8}
                    onPress={() => handleSubcategoryPress(sub)}
                    style={[
                      styles.subTag,
                      isSelected ? styles.subTagActive : styles.subTagInactive
                    ]}
                  >
                    <VText 
                      variant="caption" 
                      color={isSelected ? theme.colors.background : theme.colors.primary}
                    >
                      {sub}
                    </VText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Results Grid List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsScroll}
          >
            <View style={styles.resultsHeader}>
              <VText variant="caption" color={theme.colors.textMuted}>
                {filteredVendors.length} VENDORS FOUND
              </VText>
            </View>

            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => {
                const isPremium = vendor.subscription_tier > 1;
                return (
                  <TouchableOpacity
                    key={vendor.id}
                    activeOpacity={0.8}
                    onPress={() => onViewVendorProfile(vendor.id)}
                    style={[
                      styles.vendorResultCard, 
                      isPremium ? styles.cardPremium : styles.cardNormal,
                      theme.shadows.soft
                    ]}
                  >
                    <Image source={{ uri: vendor.image }} style={styles.vendorCardImg} />
                    <View style={styles.vendorCardInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <VText variant="h3" numberOfLines={1} style={{ maxWidth: '70%' }}>
                          {vendor.business_name}
                        </VText>
                        {isPremium && (
                          <View style={styles.premiumBadge}>
                            <Ionicons name="sparkles" size={8} color="#FFFFFF" style={{ marginRight: 2 }} />
                            <VText variant="caption" color="#FFFFFF" style={{ fontSize: normalize(8) }}>BOOSTED</VText>
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
                        <View style={[styles.statusDot, { backgroundColor: vendor.is_open ? theme.colors.accent : theme.colors.textMuted }]} />
                        <VText variant="caption" color={vendor.is_open ? theme.colors.accent : theme.colors.textMuted} style={{ fontSize: 9 }}>
                          {vendor.is_open ? 'ONLINE' : 'OFFLINE'}
                        </VText>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={normalize(48)} color={theme.colors.textMuted} />
                <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginTop: theme.spacing.sm }}>
                  No active vendors found in this category right now.
                </VText>
              </View>
            )}
          </ScrollView>
        </View>

      </View>
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
