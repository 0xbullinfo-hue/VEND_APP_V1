import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Adaptive typography scaling for any screen size
const scale = SCREEN_WIDTH / 375;
export function normalize(size: number) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

export const theme = {
  colors: {
    primary: '#115C55',      // Premium Teal Green
    primaryLight: '#E8F5F3', // Soft Teal backdrop
    primaryDark: '#0B3E39',  // Darker Teal for emphasis
    background: '#FFFFFF',   // Pure White background
    surface: '#F8F9FA',      // Light surface background
    textMain: '#111817',     // Main text body
    textMuted: '#6B7280',    // Muted/gray text
    border: '#E5E7EB',       // Light gray border
    cardBorder: '#F3F4F6',   // Soft card boundary
    accent: '#10B981',       // Success / Online Green
    warning: '#F59E0B',      // Rating Stars Amber
    danger: '#EF4444',       // SOS / Error Red
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  typography: {
    // System-safe font stack. Inter is shipped as 'Inter' on iOS 16+ and
    // Android 12+ natively. On older OS, it falls back to the system sans-serif.
    // All weight differences are expressed via fontWeight so no custom font
    // loading/Expo font hook is needed.
    fontDisplay: 'Inter',
    fontSans: 'Inter',
    h1: {
      fontSize: normalize(28),
      fontFamily: 'Inter',
      fontWeight: '900' as const,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: normalize(20),
      fontFamily: 'Inter',
      fontWeight: '800' as const,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: normalize(16),
      fontFamily: 'Inter',
      fontWeight: '700' as const,
    },
    body: {
      fontSize: normalize(14),
      fontFamily: 'Inter',
      fontWeight: '500' as const,
      lineHeight: normalize(20),
    },
    subtext: {
      fontSize: normalize(12),
      fontFamily: 'Inter',
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: normalize(10),
      fontFamily: 'Inter',
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  layout: {
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    isSmallDevice: SCREEN_WIDTH < 375,
    // Mobile shell constraints for cross-platform web
    webContainer: Platform.OS === 'web' ? {
      maxWidth: 480,
      alignSelf: 'center' as const,
      width: '100%' as const,
      minHeight: '100vh' as any,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 30,
    } : {},
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    premium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
    glow: {
      shadowColor: '#115C55',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
