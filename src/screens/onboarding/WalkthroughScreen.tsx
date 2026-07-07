import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, VButton } from '../../components/SharedComponents';
import { Ionicons } from '../../components/VIcons';

const { width } = Dimensions.get('window');

interface WalkthroughScreenProps {
  onGetStarted: () => void;
}

export const WalkthroughScreen: React.FC<WalkthroughScreenProps> = ({ onGetStarted }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Hyper-Local Map Discovery',
      description: 'See live, active vendors in your neighborhood in real-time. Boosted vendor locations shine with premium map markers.',
      icon: 'map-outline',
      color: '#E8F5F3',
    },
    {
      title: 'Secure & Verifiable Visits',
      description: 'Home-based vendor coordinates are masked for privacy. Request directions and complete the handshake code to verify your visit.',
      icon: 'shield-checkmark-outline',
      color: '#ECECFF',
    },
    {
      title: 'Explore to Earn VEND Points',
      description: 'Earn points with every profile explore, saved listing, or validated physical visit. Redeem point milestones for premium discounts.',
      icon: 'sparkles-outline',
      color: '#FFF8E8',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onGetStarted();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header - Skip Button */}
      <View style={styles.topHeader}>
        {currentSlide > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.navIcon}>
            <Ionicons name="arrow-back" size={normalize(22)} color={theme.colors.textMain} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <TouchableOpacity onPress={onGetStarted}>
          <VText variant="subtext" color={theme.colors.primary}>Skip</VText>
        </TouchableOpacity>
      </View>

      {/* Main Slide Content */}
      <View style={styles.slideContent}>
        {/* Animated Icon Circle */}
        <View style={[styles.iconCircle, { backgroundColor: slide.color }]}>
          <Ionicons name={slide.icon as any} size={normalize(64)} color={theme.colors.primary} />
        </View>

        {/* Text Area */}
        <View style={styles.textContainer}>
          <VText variant="h2" align="center" style={styles.slideTitle}>
            {slide.title}
          </VText>
          <VText variant="body" align="center" color={theme.colors.textMuted} style={styles.slideDesc}>
            {slide.description}
          </VText>
        </View>
      </View>

      {/* Footer controls */}
      <View style={styles.footerContainer}>
        {/* Progress indicators */}
        <View style={styles.indicatorRow}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentSlide ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <VButton
          title={currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          icon={currentSlide === slides.length - 1 ? 'rocket-outline' : 'arrow-forward'}
          style={[styles.actionBtn, theme.shadows.soft]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
  },
  topHeader: {
    height: normalize(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
  },
  navIcon: {
    padding: 4,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  iconCircle: {
    width: normalize(140),
    height: normalize(140),
    borderRadius: normalize(70),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize(40),
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    marginBottom: theme.spacing.md,
  },
  slideDesc: {
    lineHeight: normalize(20),
    paddingHorizontal: theme.spacing.sm,
  },
  footerContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: Platform.OS === 'android' ? normalize(60) : normalize(50),
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 20,
    backgroundColor: theme.colors.primary,
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: theme.colors.border,
  },
  actionBtn: {
    width: '100%',
  },
});
