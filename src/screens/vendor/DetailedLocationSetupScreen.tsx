import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VInput, HeaderBar } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';

interface DetailedLocationSetupScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export const DetailedLocationSetupScreen: React.FC<DetailedLocationSetupScreenProps> = ({
  onBack,
  onComplete
}) => {
  const [businessType, setBusinessType] = useState<'home' | 'physical'>('physical');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Detailed Location Setup" showPoints={false} showBack={true} onBack={onBack} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: 'bold' }}>Step 3 of 3</VText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <VText variant="h1" style={styles.pageTitle}>Where can customers find you?</VText>
        <VText variant="body" color={theme.colors.textMuted} style={styles.pageSub}>
          VEND relies heavily on precise location pinning. Please help us place you on the live map.
        </VText>

        <View style={styles.typeCards}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setBusinessType('home')}
            style={[styles.typeCard, businessType === 'home' && styles.typeCardActive]}
          >
            <View style={[styles.typeIconBox, businessType === 'home' && styles.typeIconBoxActive]}>
              <Ionicons name="home-outline" size={24} color={businessType === 'home' ? theme.colors.primary : theme.colors.textMuted} />
            </View>
            <VText variant="h3" style={{ marginBottom: 4 }}>Home-Based Business</VText>
            <VText variant="caption" color={theme.colors.textMuted}>I operate from my residence. Pin drop is approximate.</VText>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setBusinessType('physical')}
            style={[styles.typeCard, businessType === 'physical' && styles.typeCardActive]}
          >
            <View style={[styles.typeIconBox, businessType === 'physical' && styles.typeIconBoxActive]}>
              <Ionicons name="storefront-outline" size={24} color={businessType === 'physical' ? theme.colors.primary : theme.colors.textMuted} />
            </View>
            <VText variant="h3" style={{ marginBottom: 4 }}>Physical Shop/Storefront</VText>
            <VText variant="caption" color={theme.colors.textMuted}>I have a dedicated retail space. Pin drop is exact.</VText>
          </TouchableOpacity>
        </View>

        <VText variant="h3" style={styles.sectionLabel}>Physical Address Details</VText>
        <VInput
          placeholder="e.g. 123 Market Road, Ikeja"
          value={address}
          onChangeText={setAddress}
          icon="location-outline"
          style={{ marginBottom: theme.spacing.md }}
        />

        <VText variant="h3" style={styles.sectionLabel}>Direct Map Link (Google/Apple)</VText>
        <VInput
          placeholder="Paste shared map link here..."
          value={mapLink}
          onChangeText={setMapLink}
          icon="link-outline"
          style={{ marginBottom: theme.spacing.lg }}
        />

        <View style={styles.pinDropCard}>
          <View style={styles.pinDropHeader}>
            <Ionicons name="map" size={20} color={theme.colors.primary} />
            <VText variant="h3" style={{ marginLeft: 8 }}>Drop a Pin</VText>
          </View>
          <View style={styles.mockMapArea}>
            <View style={styles.mockMapPin}>
              <Ionicons name="location" size={32} color={theme.colors.danger} />
            </View>
            <VText variant="caption" color={theme.colors.primary} style={styles.mockMapText}>Tap map to adjust</VText>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <VButton
          title="Complete Profile Setup"
          onPress={onComplete}
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
  },
  pinDropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mockMapArea: {
    height: normalize(150),
    backgroundColor: '#E1E6EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockMapPin: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mockMapText: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    fontWeight: 'bold',
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
