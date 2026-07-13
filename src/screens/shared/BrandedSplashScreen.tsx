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
            size={normalize(48)}
            color="#F59E0B"
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
    backgroundColor: '#115C55', // VEND Primary Teal
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoCircle: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  logoPin: {
    position: 'absolute',
    top: -normalize(15),
    zIndex: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  logoV: {
    fontSize: normalize(56),
    fontWeight: '900',
    marginTop: normalize(5),
  },
  brandText: {
    fontSize: normalize(42),
    letterSpacing: 4,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: normalize(60),
  },
  tagline: {
    letterSpacing: 2,
  },
});
