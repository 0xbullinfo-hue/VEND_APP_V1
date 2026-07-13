import React, { useEffect } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';

const { width } = Dimensions.get('window');

export const BrandedSplashScreen: React.FC = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Ionicons
            name="location"
            size={normalize(32)}
            color="#FF7A21" // Specific Orange
            style={styles.logoPin}
          />
          <VText variant="h1" color="#FFFFFF" style={styles.logoV}>V</VText>
        </View>
        <VText variant="h1" color="#FFFFFF" style={styles.brandText}>VEND</VText>
      </Animated.View>

      <View style={styles.footer}>
        <VText variant="caption" color="rgba(255,255,255,0.6)" style={styles.tagline}>
          HYPERLOCAL • SECURE • FAST
        </VText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background as per shared logo image
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    flexDirection: 'row', // Horizontal layout: Icon + Text
  },
  logoCircle: {
    width: normalize(120),
    height: normalize(120),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  logoPin: {
    position: 'absolute',
    top: normalize(15),
    left: normalize(15),
    zIndex: 10,
  },
  logoV: {
    fontSize: normalize(80),
    fontWeight: '600',
    color: '#346A5E', // Muted dark teal from image
    fontFamily: theme.typography.fontDisplay,
  },
  brandText: {
    fontSize: normalize(44),
    letterSpacing: 2,
    fontWeight: '700',
    color: '#346A5E',
    marginLeft: theme.spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: normalize(60),
  },
  tagline: {
    letterSpacing: 2,
  },
});
