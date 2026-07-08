import React, { useState, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView, Platform, PermissionsAndroid, TextInput } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { MOCK_LOCALITIES } from '../../lib/mockData';
import { Ionicons } from '../../components/VIcons';

interface LocalitySelectionScreenProps {
  onLocalityConfirmed: () => void;
}

export const LocalitySelectionScreen: React.FC<LocalitySelectionScreenProps> = ({ onLocalityConfirmed }) => {
  const { setLocalityById, setOnboardingLocality } = useApp();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter localities based on search query for global scalability
  const filteredLocalities = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return MOCK_LOCALITIES;
    return MOCK_LOCALITIES.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query) ||
        loc.state.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleRequestPermission = async () => {
    setLoading(true);

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'VEND Global Access',
            message: 'VEND needs your location to connect you with the nearest premium vendors in your region.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLoading(false);
          setPermissionGranted(true);
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      Geolocation.requestAuthorization();
    }

    Geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        setPermissionGranted(true);
        // Default to Lagos Mainland if position logic isn't integrated yet
        setSelectedId(1);
      },
      (error) => {
        setLoading(false);
        setPermissionGranted(true);
        setSelectedId(1);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleConfirm = async () => {
    if (selectedId !== null) {
      setLocalityById(selectedId);
      await setOnboardingLocality(selectedId);
      onLocalityConfirmed();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <VText variant="h1" color={theme.colors.primary} style={styles.title}>
            Choose Your Region
          </VText>
          <VText variant="body" color={theme.colors.textMuted}>
            VEND is active across Africa and beyond. Select your hyper-local hub to see live services.
          </VText>
        </View>

        {/* Action Panel */}
        {!permissionGranted ? (
          <View style={styles.permissionBox}>
            <View style={styles.permissionCircle}>
              <Ionicons name="earth" size={normalize(48)} color={theme.colors.primary} />
            </View>
            <VText variant="h2" align="center" style={styles.boxTitle}>
              Hyper-Local Discovery
            </VText>
            <VText variant="body" align="center" color={theme.colors.textMuted} style={styles.boxDesc}>
              Enable location to automatically find the VEND hub nearest to you.
            </VText>
            
            <VButton
              title="Locate Me Automatically"
              onPress={handleRequestPermission}
              loading={loading}
              icon="locate-outline"
              style={[styles.permBtn, theme.shadows.soft]}
            />
            
            <TouchableOpacity onPress={() => setPermissionGranted(true)} style={styles.skipLink}>
              <VText variant="subtext" color={theme.colors.primary} align="center">
                Or select city/region manually
              </VText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, marginVertical: theme.spacing.lg }}>

            {/* Premium Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search city, state, or country..."
                placeholderTextColor={theme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { fontFamily: theme.typography.fontSans }]}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
              {filteredLocalities.length > 0 ? (
                filteredLocalities.map((loc) => {
                  const isSelected = selectedId === loc.id;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedId(loc.id)}
                      style={[
                        styles.localityItem,
                        isSelected ? styles.itemActive : styles.itemInactive
                      ]}
                    >
                      <View style={styles.itemLeft}>
                        <Ionicons
                          name="business"
                          size={20}
                          color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <VText
                            variant="h3"
                            color={isSelected ? theme.colors.primary : theme.colors.textMain}
                          >
                            {loc.name}
                          </VText>
                          <VText variant="caption" color={theme.colors.textMuted}>
                            {loc.state}
                          </VText>
                        </View>
                      </View>

                      <View style={styles.itemRight}>
                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                        ) : (
                          <View style={styles.uncheckedCircle} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="map-outline" size={48} color={theme.colors.border} />
                  <VText variant="body" color={theme.colors.textMuted} align="center" style={{ marginTop: 12 }}>
                    We haven't reached "{searchQuery}" yet.{"\n"}VEND is expanding daily!
                  </VText>
                </View>
              )}
            </ScrollView>

            <VButton
              title="Join This Locality"
              onPress={handleConfirm}
              disabled={selectedId === null}
              icon="arrow-forward"
              style={[styles.confirmBtn, theme.shadows.soft]}
            />
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: normalize(10),
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontWeight: '900',
    marginBottom: theme.spacing.xs,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  permissionCircle: {
    width: normalize(96),
    height: normalize(96),
    borderRadius: normalize(48),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  boxTitle: {
    marginBottom: theme.spacing.sm,
  },
  boxDesc: {
    lineHeight: normalize(20),
    marginBottom: theme.spacing.xxl,
  },
  permBtn: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  skipLink: {
    paddingVertical: theme.spacing.sm,
  },
  
  // Search & List styling
  searchContainer: {
    height: normalize(52),
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: theme.colors.textMain,
    fontSize: normalize(14),
  },
  listScroll: {
    paddingBottom: theme.spacing.xl,
  },
  localityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: normalize(16),
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    ...theme.shadows.soft,
  },
  itemActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  itemInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.cardBorder,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRight: {},
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  confirmBtn: {
    marginTop: theme.spacing.md,
  },
});
