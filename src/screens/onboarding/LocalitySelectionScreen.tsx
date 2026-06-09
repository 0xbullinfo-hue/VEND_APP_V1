import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { MOCK_LOCALITIES } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocalitySelectionScreenProps {
  onLocalityConfirmed: () => void;
}

export const LocalitySelectionScreen: React.FC<LocalitySelectionScreenProps> = ({ onLocalityConfirmed }) => {
  const { setLocalityById } = useApp();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      setLoading(false);
      if (status === 'granted') {
        setPermissionGranted(true);
        // Optional: you could actually fetch their location here
        // const location = await Location.getCurrentPositionAsync({});
        // For now, auto-select first locality as a convenience based on mock flow
        setSelectedId(1);
      } else {
        // Handle denied permission (e.g. alert user or force manual selection)
        alert('Location permission denied. Please select your locality manually.');
        setPermissionGranted(true); // fall back to manual list
      }
    } catch (error) {
      setLoading(false);
      console.error('Error requesting location permission:', error);
      setPermissionGranted(true); // fall back
    }
  };

  const handleConfirm = () => {
    if (selectedId !== null) {
      setLocalityById(selectedId);
      onLocalityConfirmed();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <VText variant="h1" color={theme.colors.primary} style={styles.title}>
            Locality Setup
          </VText>
          <VText variant="body" color={theme.colors.textMuted}>
            VEND matches you with live vendors in your direct proximity. Choose your hyper-local LGA/Ward.
          </VText>
        </View>

        {/* Action Panel */}
        {!permissionGranted ? (
          <View style={styles.permissionBox}>
            <View style={styles.permissionCircle}>
              <Ionicons name="location-outline" size={normalize(48)} color={theme.colors.primary} />
            </View>
            <VText variant="h2" align="center" style={styles.boxTitle}>
              Enable Location Services
            </VText>
            <VText variant="body" align="center" color={theme.colors.textMuted} style={styles.boxDesc}>
              This allows VEND to display nearby vendors on your live map in real time.
            </VText>
            
            <VButton
              title="Share Device Location"
              onPress={handleRequestPermission}
              loading={loading}
              icon="locate-outline"
              style={[styles.permBtn, theme.shadows.soft]}
            />
            
            <TouchableOpacity onPress={() => setPermissionGranted(true)} style={styles.skipLink}>
              <VText variant="subtext" color={theme.colors.primary} align="center">
                Or select LGA/Ward manually
              </VText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, marginVertical: theme.spacing.lg }}>
            <VText variant="h3" style={styles.listLabel}>Select LGA/Ward</VText>
            
            <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
              {MOCK_LOCALITIES.map((loc) => {
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
                        name="compass-outline" 
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
                          {loc.state} State
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
              })}
            </ScrollView>

            <VButton
              title="Confirm Locality"
              onPress={handleConfirm}
              disabled={selectedId === null}
              icon="checkmark"
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
    marginTop: normalize(20),
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
  
  // List styling
  listLabel: {
    marginBottom: theme.spacing.md,
  },
  listScroll: {
    paddingBottom: theme.spacing.xl,
  },
  localityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: normalize(12),
    marginBottom: theme.spacing.sm,
    borderWidth: 1.5,
  },
  itemActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  itemInactive: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemRight: {},
  uncheckedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  confirmBtn: {
    marginTop: theme.spacing.md,
  },
});
