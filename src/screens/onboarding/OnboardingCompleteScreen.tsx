import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

interface OnboardingCompleteScreenProps {
  onEnterApp: () => void;
}

export const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({ onEnterApp }) => {
  const { user, locality } = useApp();
  const points = user?.points || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-done" size={normalize(48)} color={theme.colors.background} />
          </View>
          <VText variant="h1" color={theme.colors.primary} align="center" style={styles.title}>
            You are ready!
          </VText>
          <VText variant="body" color={theme.colors.textMuted} align="center">
            Your VEND profile has been configured successfully.
          </VText>
        </View>

        {/* Profile Card Summary */}
        <View style={[styles.profileCard, theme.shadows.premium]}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarCircle}>
              <Ionicons 
                name={user?.role === 'vendor' ? "storefront-outline" : "person-outline"} 
                size={normalize(24)} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={{ marginLeft: 12 }}>
              <VText variant="h3">{user?.name}</VText>
              <VText variant="caption">{user?.role === 'vendor' ? 'Service Provider' : 'Customer Explorer'}</VText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cardBody}>
            {/* Locality row */}
            <View style={styles.summaryRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                <VText variant="body" color={theme.colors.textMuted} style={{ marginLeft: 8 }}>Locality</VText>
              </View>
              <VText variant="h3">{locality?.name || 'Mainland'}</VText>
            </View>

            {/* Points row */}
            <View style={styles.summaryRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="star-outline" size={18} color={theme.colors.primary} />
                <VText variant="body" color={theme.colors.textMuted} style={{ marginLeft: 8 }}>Points Balance</VText>
              </View>
              <VText variant="h3" color={theme.colors.primary}>{points} PTS</VText>
            </View>

            {/* Status row */}
            <View style={styles.summaryRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons name="shield-outline" size={18} color={theme.colors.primary} />
                <VText variant="body" color={theme.colors.textMuted} style={{ marginLeft: 8 }}>Verification Status</VText>
              </View>
              <VText variant="h3" color={theme.colors.accent}>Active</VText>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.buttonWrapper}>
          <VButton
            title={user?.role === 'vendor' ? 'Launch Vendor Hub' : 'Enter VEND Platform'}
            onPress={onEnterApp}
            icon="enter-outline"
            style={theme.shadows.soft}
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: normalize(20),
  },
  checkCircle: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontWeight: '900',
    marginBottom: theme.spacing.xs,
  },
  profileCard: {
    backgroundColor: theme.colors.background,
    borderRadius: normalize(20),
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1.5,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  cardBody: {
    gap: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonWrapper: {
    marginBottom: normalize(40),
  },
});
