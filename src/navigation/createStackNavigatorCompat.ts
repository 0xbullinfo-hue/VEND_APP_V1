/**
 * createStackNavigatorCompat
 *
 * Platform-aware stack navigator factory.
 *
 * - iOS / Android → uses `createNativeStackNavigator` from @react-navigation/native-stack
 *   for native screen transitions and performance.
 * - Web → uses `createStackNavigator` from @react-navigation/stack (JS-based)
 *   because native-stack silently fails on web.
 *
 * All navigator files import from THIS module instead of directly from
 * @react-navigation/native-stack, keeping the swap isolated to one file.
 */
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createStackNavigator } from '@react-navigation/stack';

/**
 * Returns a stack navigator appropriate for the current platform.
 * API is compatible with both — screens just use `<Stack.Screen>` etc.
 */
export function createStackNavigatorCompat<T extends Record<string, object | undefined>>() {
  if (Platform.OS === 'web') {
    return createStackNavigator<T>();
  }
  return createNativeStackNavigator<T>();
}

// Re-export the type that works on both platforms.
// On web we use StackNavigationProp; on native we use NativeStackNavigationProp.
// Both are structurally compatible for navigation.navigate / goBack / etc.
export type { StackNavigationProp } from '@react-navigation/stack';
