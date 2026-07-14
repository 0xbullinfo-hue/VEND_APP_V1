import 'react-native';

declare module 'react-native' {
  interface ViewStyle {
    gap?: number;
    rowGap?: number;
    columnGap?: number;
  }
}
