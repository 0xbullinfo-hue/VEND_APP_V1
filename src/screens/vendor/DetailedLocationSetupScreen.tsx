import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../components/MapViewCompat';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';
import { useApp } from '../../contexts/AppContext';
import { uberMapStyle } from '../../theme/mapStyles';

interface DetailedLocationSetupScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export const DetailedLocationSetupScreen: React.FC<DetailedLocationSetupScreenProps> = ({
  onBack,
  onComplete
}) => {
  const { locality, registerVendor, user } = useApp();
  const [businessType, setBusinessType] = useState<'home' | 'physical'>('physical');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [loading, setLoading] = useState(false);

  const initialRegion = {
    latitude: locality?.center_location?.latitude || 6.5165,
    longitude: locality?.center_location?.longitude || 3.3792,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const [markerLocation, setMarkerLocation] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude
  });

  const handleComplete = async () => {
    setLoading(true);
    // In a real app, you would pass more detailed bio/category info here
    // For now, we use the values from the form
    await registerVendor(
      user,
      user?.name || 'My Business',
      'Premium vendor on VEND.',
      'Professional Services',
      'General',
      address,
      businessType === 'home',
      markerLocation.latitude,
      markerLocation.longitude
    );
    setLoading(false);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Business Discovery Map" showPoints={false} showBack={true} onBack={onBack} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>FINAL STEP</VText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <VText variant="h1" style={styles.pageTitle}>Map Visibility Setup</VText>
        <VText variant="body" color={theme.colors.textMuted} style={styles.pageSub}>
          Confirm where customers will see your business pin on the live map.
        </VText>

        <View style={styles.typeCards}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setBusinessType('home')}
            style={[styles.typeCard, businessType === 'home' && styles.typeCardActive]}
          >
            <View style={[styles.typeIconBox, businessType === 'home' && styles.typeIconBoxActive]}>
              <Ionicons name="home" size={24} color={businessType === 'home' ? theme.colors.primary : theme.colors.textMuted} />
            </View>
            <VText variant="h3" style={{ marginBottom: 4 }}>Home-Based / Mobile</VText>
            <VText variant="caption" color={theme.colors.textMuted}>I visit customers or work from home. (Fuzzy map pin)</VText>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setBusinessType('physical')}
            style={[styles.typeCard, businessType === 'physical' && styles.typeCardActive]}
          >
            <View style={[styles.typeIconBox, businessType === 'physical' && styles.typeIconBoxActive]}>
              <Ionicons name="business" size={24} color={businessType === 'physical' ? theme.colors.primary : theme.colors.textMuted} />
            </View>
            <VText variant="h3" style={{ marginBottom: 4 }}>Physical Storefront</VText>
            <VText variant="caption" color={theme.colors.textMuted}>I have a fixed walk-in location. (Precise map pin)</VText>
          </TouchableOpacity>
        </View>

        <VText variant="h3" style={styles.sectionLabel}>Display Address</VText>
        <VInput
          placeholder="e.g. Suite 4, Abuja Shopping Mall"
          value={address}
          onChangeText={setAddress}
          icon="location-outline"
          style={{ marginBottom: theme.spacing.lg }}
        />

        <View style={styles.pinDropCard}>
          <View style={styles.pinDropHeader}>
            <Ionicons name="map" size={20} color={theme.colors.primary} />
            <VText variant="h3" style={{ marginLeft: 8 }}>Drop Your Business Pin</VText>
          </View>
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              customMapStyle={uberMapStyle}
              initialRegion={initialRegion}
              onPress={(e) => setMarkerLocation(e.nativeEvent.coordinate)}
            >
              <Marker
                coordinate={markerLocation}
                draggable
                onDragEnd={(e) => setMarkerLocation(e.nativeEvent.coordinate)}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="location" size={40} color={theme.colors.primary} />
                </View>
              </Marker>
            </MapView>
            <View style={styles.mapOverlayPill}>
              <VText variant="caption" color={theme.colors.primary}>LONG PRESS PIN TO DRAG</VText>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <VButton
          title="Launch Business on VEND"
          onPress={handleComplete}
          loading={loading}
          style={styles.fullBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: normalize(100),
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginLeft: theme.spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  pageTitle: {
    fontSize: normalize(26),
    marginBottom: theme.spacing.sm,
  },
  pageSub: {
    marginBottom: theme.spacing.xl,
    lineHeight: normalize(22),
  },
  typeCards: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  typeCard: {
    padding: theme.spacing.lg,
    borderRadius: normalize(16),
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  typeCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  typeIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  typeIconBoxActive: {
    backgroundColor: theme.colors.background,
  },
  sectionLabel: {
    marginBottom: theme.spacing.sm,
  },
  pinDropCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: normalize(16),
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.lg,
  },
  pinDropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mapWrapper: {
    height: normalize(220),
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
  mapOverlayPill: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  fullBtn: {
    width: '100%',
  },
});
