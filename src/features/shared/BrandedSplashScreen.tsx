import React, { useEffect } from 'react';
import { StyleSheet, View, Animated, Image } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText } from '../../components/SharedComponents';

export const BrandedSplashScreen: React.FC = () => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../../assets/branding/vend_logo_final.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.footer}>
        <VText variant="caption" color="#346A5E" style={styles.tagline}>
          HYPERLOCAL • SECURE • FAST
        </VText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: normalize(280),
    height: normalize(120),
  },
  footer: {
    position: 'absolute',
    bottom: normalize(60),
  },
  tagline: {
    letterSpacing: 2,
    fontWeight: '700',
    opacity: 0.8,
  },
});
