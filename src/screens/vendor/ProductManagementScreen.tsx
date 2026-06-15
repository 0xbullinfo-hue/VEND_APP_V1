import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface ProductManagementScreenProps {
  onBack: () => void;
  /** Optional: lets the user jump straight to the subscription/upgrade screen when they hit their plan's listing limit. */
  onUpgrade?: () => void;
}

export const ProductManagementScreen: React.FC<ProductManagementScreenProps> = ({ onBack, onUpgrade }) => {
  const { vendors, myVendorProfile, myVendorPlan, addVendorService } = useApp();
  const vendor = myVendorProfile || vendors[0];

  const [isAddingListing, setIsAddingListing] = useState(false);
  
  // Add Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [locationType, setLocationType] = useState<'hq' | 'specific'>('hq');

  const atListingLimit = vendor.services.length >= myVendorPlan.maxListings;

  const handleStartAddListing = () => {
    if (atListingLimit) {
      if (onUpgrade) {
        onUpgrade();
      } else {
        alert(`You've reached the ${myVendorPlan.maxListings}-listing limit on the ${myVendorPlan.name} plan. Upgrade your plan to add more.`);
      }
      return;
    }
    setIsAddingListing(true);
  };

  const handleSaveItem = (keepAdding: boolean = false) => {
    if (!title) return;

    const added = addVendorService(
      vendor.id,
      title,
      desc || 'No description provided.',
      category || 'Uncategorized',
      parseInt(price.replace(/[^0-9]/g, '')) || 0,
      10, // default stock
      'AVAILABLE',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80'
    );

    if (!added) {
      // AppContext already raises a "limit reached" notification toast.
      if (!keepAdding) setIsAddingListing(false);
      return;
    }

    // Reset form
    setTitle('');
    setPrice('');
    setCategory('');
    setDesc('');
    if (!keepAdding) setIsAddingListing(false);
  };

  const renderManageListings = () => (
    <View style={styles.viewContainer}>
      <View style={styles.manageHeader}>
        <VText variant="h2" style={{ fontSize: normalize(22) }}>Manage Listings</VText>
        <View style={styles.planUsageRow}>
          <VText variant="caption" color={theme.colors.textMuted}>
            {vendor.services.length} / {myVendorPlan.maxListings} listings used · {myVendorPlan.name} plan
          </VText>
          {atListingLimit && (
            <TouchableOpacity onPress={() => onUpgrade?.()} style={styles.upgradePill}>
              <Ionicons name="arrow-up-circle" size={14} color={theme.colors.primary} />
              <VText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4, fontWeight: '700' }}>
                Upgrade for more
              </VText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md }}>
        <VInput
          placeholder="Search products..."
          value=""
          onChangeText={() => {}}
          icon="search-outline"
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {vendor.services.map((item: any) => (
          <View key={item.id} style={[styles.productCard, theme.shadows.soft]}>
            {/* Top Badge */}
            <View style={[styles.stockBadge, item.stockStatus === 'SOLD OUT' ? styles.stockSoldOut : styles.stockAvailable]}>
              <VText variant="caption" color={item.stockStatus === 'SOLD OUT' ? theme.colors.danger : theme.colors.primary} style={{ fontWeight: 'bold', fontSize: 10 }}>
                {item.stockStatus}
              </VText>
            </View>

            <View style={styles.productTopRow}>
              <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80' }} style={styles.productImg} />
              <View style={styles.productInfo}>
                <VText variant="h3">{item.title}</VText>
                <VText variant="caption" color={theme.colors.textMuted} style={{ marginVertical: 2 }}>
                  {item.category || 'Product'}
                </VText>
                <VText variant="h3" color={theme.colors.primary}>
                  ₦ {item.price?.toLocaleString() || 'N/A'}
                </VText>
              </View>
            </View>
            
            <View style={styles.productDivider} />
            
            <View style={styles.productBottomRow}>
              <TouchableOpacity style={styles.locateBtn}>
                <Ionicons name="location" size={14} color={theme.colors.textMuted} />
                <VText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>Locate on Map</VText>
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity>
                  <Ionicons name="pencil-outline" size={20} color={theme.colors.textMain} />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        <View style={{ height: normalize(180) }} />
      </ScrollView>

      <View style={styles.floatingActionBox}>
        <VButton
          title={atListingLimit ? `Upgrade to Add More (${myVendorPlan.maxListings} max)` : "+ New Product"}
          onPress={handleStartAddListing}
          style={{ borderRadius: 30 }}
        />
      </View>
    </View>
  );

  const renderAddListing = () => (
    <View style={styles.viewContainer}>
      <View style={styles.addHeaderRow}>
        <TouchableOpacity onPress={() => setIsAddingListing(false)} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textMain} />
        </TouchableOpacity>
        <VText variant="h2" style={{ marginLeft: 8 }}>Add Listings</VText>
      </View>

      <ScrollView contentContainerStyle={styles.addContent} showsVerticalScrollIndicator={false}>
        {/* Photo Upload */}
        <VText variant="h3" style={styles.label}>Photos (0/5)</VText>
        <View style={styles.photoUploadBox}>
          <Ionicons name="images-outline" size={32} color={theme.colors.primary} />
          <VText variant="caption" color={theme.colors.primary} style={{ marginTop: 8, fontWeight: 'bold' }}>
            + Add Photo
          </VText>
        </View>

        {/* Inputs */}
        <VText variant="h3" style={styles.label}>Product/Service Title</VText>
        <VInput
          placeholder="e.g. Organic Honey Jar"
          value={title}
          onChangeText={setTitle}
          style={{ marginBottom: theme.spacing.md }}
        />

        <VText variant="h3" style={styles.label}>Price (NGN)</VText>
        <VInput
          placeholder="0.00"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          style={{ marginBottom: theme.spacing.md }}
        />

        <VText variant="h3" style={styles.label}>Category</VText>
        <VInput
          placeholder="Select Category"
          value={category}
          onChangeText={setCategory}
          icon="chevron-down"
          style={{ marginBottom: theme.spacing.md }}
        />

        <VText variant="h3" style={styles.label}>Description</VText>
        <VInput
          placeholder="Enter product details..."
          value={desc}
          onChangeText={setDesc}
          style={styles.textArea}
        />

        <VText variant="h3" style={styles.label}>Where to buy?</VText>
        <View style={styles.radioGroup}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setLocationType('hq')}
            style={[styles.radioCard, locationType === 'hq' && styles.radioCardActive]}
          >
            <View style={[styles.radioCircle, locationType === 'hq' && styles.radioCircleActive]} />
            <VText variant="caption">Business HQ</VText>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setLocationType('specific')}
            style={[styles.radioCard, locationType === 'specific' && styles.radioCardActive]}
          >
            <View style={[styles.radioCircle, locationType === 'specific' && styles.radioCircleActive]} />
            <VText variant="caption">Specific Location</VText>
          </TouchableOpacity>
        </View>

        <View style={styles.addBtnRow}>
          <VButton title="Save Item" onPress={() => handleSaveItem(false)} style={{ flex: 1 }} />
          <VButton
            title="Add Another Item"
            onPress={() => handleSaveItem(true)}
            variant="outline"
            disabled={atListingLimit}
            style={{ flex: 1, marginLeft: theme.spacing.md }}
          />
        </View>
        
        <View style={{ height: normalize(180) }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.publishBottomBar}>
        <VButton title="Publish All Listings" onPress={() => handleSaveItem(false)} style={{ width: '100%' }} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <HeaderBar showPoints={false} showBack={true} onBack={onBack} title="My Services" />
      {isAddingListing ? renderAddListing() : renderManageListings()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  viewContainer: {
    flex: 1,
  },
  manageHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  planUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  upgradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  productCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(16),
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  stockBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  stockAvailable: {
    backgroundColor: theme.colors.primaryLight,
  },
  stockSoldOut: {
    backgroundColor: '#FFE5E5',
  },
  productTopRow: {
    flexDirection: 'row',
  },
  productImg: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(12),
    backgroundColor: theme.colors.border,
  },
  productInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
    paddingRight: 60, // space for badge
  },
  productDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  floatingActionBox: {
    position: 'absolute',
    bottom: normalize(130),
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  /* Add Listing Styles */
  addHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  addContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  label: {
    marginBottom: 8,
    fontSize: normalize(14),
  },
  photoUploadBox: {
    height: normalize(120),
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
    borderStyle: 'dashed',
    borderRadius: normalize(16),
    backgroundColor: '#FAFAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  textArea: {
    height: normalize(100),
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  radioCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radioCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.textMuted,
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
    borderWidth: 5,
  },
  addBtnRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xxl,
  },
  publishBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: normalize(120),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.premium,
  },
});
