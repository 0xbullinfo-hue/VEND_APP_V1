import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../components/MapViewCompat';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, HeaderBar, VendorProfilePendingState } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';
import { uberMapStyle } from '../../theme/mapStyles';

interface LiveTripScreenProps {
  onTripEnd: () => void;
  onArrived: () => void;
}

export const LiveTripScreen: React.FC<LiveTripScreenProps> = ({ onTripEnd, onArrived }) => {
  const { activeTrip, vendors, triggerSOS, completeTrip, cancelTrip } = useApp();
  const [eta, setEta] = useState(12); // minutes
  const [distance, setDistance] = useState(2.4); // km

  const vendor = vendors.find(v => v.id === activeTrip?.vendorId);
  const mapRef = useRef<MapView>(null);

  if (!vendor) {
    return <VendorProfilePendingState title="Trip Unavailable" onBack={onTripEnd} />;
  }

  // Mock User Location (Ideally fetched via expo-location)
  const origin = {
    latitude: (vendor.exact_location?.latitude || 6.5165) - 0.015,
    longitude: (vendor.exact_location?.longitude || 3.3792) - 0.015,
  };

  const destination = {
    latitude: vendor.exact_location?.latitude || 6.5165,
    longitude: vendor.exact_location?.longitude || 3.3792,
  };

  const initialRegion = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    const latDiff = destination.latitude - origin.latitude;
    const lngDiff = destination.longitude - origin.longitude;
    const approxDistanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;

    setDistance(Math.round(approxDistanceKm * 10) / 10);
    setEta(Math.max(3, Math.ceil(approxDistanceKm * 4.5)));
  }, [destination.latitude, destination.longitude, origin.latitude, origin.longitude]);

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: `I'm navigating to ${vendor.business_name} using VEND. Track my trip safely! Locality: ${vendor.street_address}`,
      });
    } catch (error) {
      // Fail silently
    }
  };

  const handleSOSPress = () => {
    Alert.alert(
      "🚨 TRIGGER EMERGENCY SOS?",
      "This will notify local patrol units, VEND security desks, and all your emergency contacts immediately.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "ACTIVATE SOS", style: "destructive", onPress: triggerSOS }
      ]
    );
  };

  const handleArrived = () => {
    onArrived();
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Navigation?",
      "Are you sure you want to stop routing?",
      [
        { text: "No", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", onPress: () => {
            cancelTrip();
            onTripEnd();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <HeaderBar 
        showBack={true} 
        onBack={() => {
          cancelTrip();
          onTripEnd();
        }} 
        showPoints={false} 
        title="Live Navigation Map" 
      />

      {/* Interactive Map view representation */}
      <View style={styles.mapViewport}>
        
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          customMapStyle={uberMapStyle}
          initialRegion={initialRegion}
        >
          {/* User Marker */}
          <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userLocMarker}>
              <View style={styles.userLocPulse} />
              <Ionicons name="car" size={16} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Vendor Marker */}
          <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.vendorLocMarker}>
              <Ionicons name="flag" size={16} color="#FFFFFF" />
            </View>
          </Marker>

          {/* Fallback Straight Line (Shown while API key is missing or invalid) */}
          <Polyline
            coordinates={[origin, destination]}
            strokeColor={theme.colors.primary}
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />

        </MapView>

        {/* Floating SOS Panic Button */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={handleSOSPress}
          style={[styles.floatingSosBtn, theme.shadows.premium]}
        >
          <Ionicons name="alert-circle" size={normalize(32)} color={theme.colors.background} />
          <VText variant="caption" color={theme.colors.background} style={{ fontWeight: '900', marginTop: 2 }}>
            PANIC SOS
          </VText>
        </TouchableOpacity>

        {/* Floating Share details button */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleShareTrip}
          style={[styles.floatingShareBtn, theme.shadows.premium]}
        >
          <Ionicons name="share-social" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

      </View>

      {/* Trip Information Bottom Card */}
      <View style={[styles.tripInfoCard, theme.shadows.premium]}>
        
        {/* Proximity metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <VText variant="h1" color={theme.colors.primary} style={styles.metricBig}>
              {eta}
            </VText>
            <VText variant="caption" color={theme.colors.textMuted}>MINUTES LEFT</VText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <VText variant="h1" color={theme.colors.primary} style={styles.metricBig}>
              {distance}
            </VText>
            <VText variant="caption" color={theme.colors.textMuted}>KILOMETERS AWAY</VText>
          </View>
        </View>

        {/* Destination Info */}
        <View style={styles.destinationBox}>
          <Ionicons name="location" size={18} color={theme.colors.primary} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <VText variant="h3" numberOfLines={1}>{vendor.business_name}</VText>
            <VText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
              {vendor.street_address}
            </VText>
          </View>
        </View>

        {/* Control CTAs */}
        <View style={styles.actionBtnRow}>
          <VButton
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={{ flex: 1 }}
          />
          <VButton
            title="Arrived at Vendor"
            onPress={handleArrived}
            icon="checkmark-circle"
            style={{ flex: 2, marginLeft: theme.spacing.sm }}
          />
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mapViewport: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E1E6EB',
  },
  gpsGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  routeLine: {
    position: 'absolute',
    left: '52%',
    top: '25%',
    bottom: '22%',
    width: 6,
    backgroundColor: theme.colors.primary,
    opacity: 0.8,
    borderRadius: 3,
  },
  userLocMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6', // GPS User tracking Blue
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  userLocPulse: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  vendorLocMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  floatingSosBtn: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.danger,
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingShareBtn: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Trip Info Card
  tripInfoCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.lg : normalize(48),
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.primaryLight,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricBig: {
    fontSize: normalize(32),
    fontWeight: '900',
  },
  metricDivider: {
    width: 1.5,
    height: 32,
    backgroundColor: theme.colors.border,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: normalize(10),
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  actionBtnRow: {
    flexDirection: 'row',
  },
});
