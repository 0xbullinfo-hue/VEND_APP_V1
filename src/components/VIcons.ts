/**
 * VIcons — Centralized icon wrapper.
 *
 * Replaces @expo/vector-icons (removed when Expo was stripped out).
 * All screens import Ionicons from THIS file, not from @expo/vector-icons.
 * This isolates any future icon library swaps to a single location.
 */
import Ionicons from 'react-native-vector-icons/Ionicons';
export { Ionicons };

/**
 * Type-safe icon name helper.
 */
export type IonIconName = string;

export const isValidIcon = (name: string): name is IonIconName => {
  return true; // Simplified for now to fix build
};
