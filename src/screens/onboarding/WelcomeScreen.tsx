import React from 'react';
import { StyleSheet, View, Image, SafeAreaView, Dimensions } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onNext: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Decorative Brand Section */}
        <View style={styles.brandWrapper}>
          <View style={styles.logoCircle}>
            <VText variant="h1" color={theme.colors.background} style={styles.logoText}>
              V
            </VText>
          </View>
          <VText variant="h1" color={theme.colors.primary} style={styles.brandTitle}>
            VEND
          </VText>
          <VText variant="caption" color={theme.colors.textMuted} style={styles.tagline}>
            HYPERLOCAL DISCOVERY • REAL-TIME CONNECTION
          </VText>
        </View>

        {/* Hero Image / Illustration Mock */}
        <View style={styles.illustrationContainer}>
          <View style={styles.mapGridMock}>
            {/* Mocking a map layout with absolute elements */}
            <View style={[styles.gridDot, { top: '30%', left: '20%' }]} />
            <View style={[styles.gridDot, { top: '50%', left: '70%' }]} />
            <View style={[styles.gridDot, { top: '70%', left: '40%' }]} />
            <View style={[styles.gridPin, { top: '40%', left: '45%' }, theme.shadows.glow]}>
              <View style={styles.innerPin} />
            </View>
          </View>
        </View>

        {/* Welcome Text */}
        <View style={styles.textWrapper}>
          <VText variant="h2" align="center" style={styles.heading}>
            Find active local vendors in real-time
          </VText>
          <VText variant="body" align="center" color={theme.colors.textMuted} style={styles.description}>
            Discover verified services, track live proximity on a map, and earn VEND rewards with every verified connection in your neighborhood.
          </VText>
        </View>

        {/* Action Button */}
        <View style={styles.buttonWrapper}>
          <VButton 
            title="Let's Explore" 
            onPress={onNext} 
            icon="arrow-forward-outline"
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
  brandWrapper: {
    alignItems: 'center',
    marginTop: normalize(20),
  },
  logoCircle: {
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: normalize(28),
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: normalize(24),
    fontWeight: '900',
    marginTop: theme.spacing.sm,
    letterSpacing: 2,
  },
  tagline: {
    marginTop: theme.spacing.xs,
    fontSize: normalize(9),
    fontWeight: '700',
  },
  illustrationContainer: {
    height: normalize(220),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  mapGridMock: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: normalize(20),
    backgroundColor: theme.colors.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  gridDot: {
    width: normalize(12),
    height: normalize(12),
    borderRadius: normalize(6),
    backgroundColor: theme.colors.border,
    position: 'absolute',
  },
  gridPin: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerPin: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
    backgroundColor: theme.colors.background,
  },
  textWrapper: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  heading: {
    marginBottom: theme.spacing.md,
  },
  description: {
    lineHeight: normalize(20),
  },
  buttonWrapper: {
    marginBottom: normalize(40),
  },
});
