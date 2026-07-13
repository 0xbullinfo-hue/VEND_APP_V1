import { theme as lightTheme } from './designSystem';

export type ThemeColors = typeof lightTheme.colors;

export const darkThemeColors: ThemeColors = {
  primary: '#14B8A6',      // Brighter Teal for dark background
  primaryLight: '#0F2D2A', // Deep Teal-Green backdrop
  primaryDark: '#5EEAD4',  // Light Teal for emphasis
  background: '#0F1716',   // Deep Charcoal/Green background
  surface: '#1E2928',      // Slightly lighter charcoal surface
  textMain: '#F1F5F9',     // Near white text
  textMuted: '#94A3B8',    // Slate gray text
  border: '#2D3736',       // Dark border
  cardBorder: '#232E2D',   // Very soft card boundary
  accent: '#34D399',       // Vibrant Green
  warning: '#FBBF24',      // Vibrant Amber
  danger: '#F87171',       // Vibrant Red
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkThemeColors : lightTheme.colors;
};
