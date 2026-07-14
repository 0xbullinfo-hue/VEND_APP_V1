import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton, VImage, VendorProfilePendingState } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';
import { useApp } from '../../contexts/AppContext';

interface RegistrationSuccessScreenProps {
  onGoToDashboard: () => void;
  onAddFirstService: () => void;
}

export const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({
  onGoToDashboard,
  onAddFirstService
}) => {
  const { vendors, myVendorProfile } = useApp();
  const vendor = myVendorProfile || vendors[0];

  if (!vendor) {
    return (
      <VendorProfilePendingState
        title="Processing..."
        message="Please wait while we finalize your registration."
        onAction={onGoToDashboard}
        actionTitle="Go to Dashboard"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.successIconBox}>
          <Ionicons name="checkmark-circle" size={normalize(80)} color={theme.colors.primary} />
        </View>

        <VText variant="h1" align="center" style={{ marginBottom: theme.spacing.sm }}>
          Success
        </VText>
        <VText variant="h2" align="center" color={theme.colors.textMuted} style={{ marginBottom: theme.spacing.xxl }}>
          Registration Complete!
        </VText>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <VImage source={vendor?.image || ''} style={styles.storeLogo} />
            <View style={styles.storeInfo}>
              <VText variant="h2">{vendor?.business_name}</VText>
              <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
                {vendor?.street_address}
              </VText>
            </View>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryStats}>
            <View style={styles.statBox}>
              <VText variant="caption" color={theme.colors.textMuted}>Visibility Score</VText>
              <VText variant="h3" style={{ marginTop: 4 }}>Optimized</VText>
            </View>
            <View style={styles.statBox}>
              <VText variant="caption" color={theme.colors.textMuted}>Status</VText>
              <VText variant="h3" color={theme.colors.primary} style={{ marginTop: 4 }}>Live</VText>
            </View>
          </View>
        </View>
        
        <View style={{ flex: 1 }} />

        <VButton
          title="Go to Dashboard"
          onPress={onGoToDashboard}
          style={styles.fullBtn}
        />
        <VButton
          title="Add First Service"
          onPress={onAddFirstService}
          variant="outline"
          style={[styles.fullBtn, { marginTop: theme.spacing.md }]}
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: normalize(60),
    paddingBottom: theme.spacing.xl,
  },
  successIconBox: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: normalize(16),
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeLogo: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
    backgroundColor: theme.colors.border,
  },
  storeInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  fullBtn: {
    width: '100%',
  },
});
