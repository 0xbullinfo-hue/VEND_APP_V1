/**
 * Secure Storage Wrapper
 *
 * Safe wrapper for sensitive local data (auth tokens, refresh tokens).
 * Uses `expo-secure-store` on native platforms if available,
 * falling back to `AsyncStorage` on web or if the package is missing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically resolve SecureStore to avoid crash if package is not in package.json yet
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  if (__DEV__) {
    console.log('[SecureStorage] expo-secure-store is not installed. Falling back to AsyncStorage.');
  }
}

const isSecureStoreAvailable = (): boolean => {
  return Platform.OS !== 'web' && SecureStore !== null;
};

/**
 * Set a key/value pair securely.
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!key || typeof value !== 'string') {
    return;
  }

  try {
    if (isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    console.error(`[SecureStorage] Error setting item for key: ${key}`, error);
    // Fallback to AsyncStorage if SecureStore fails
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('[SecureStorage] Critical: AsyncStorage fallback failed', e);
    }
  }
}

/**
 * Get a value securely.
 * Returns null if not found.
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (!key) {
    return null;
  }

  try {
    if (isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  } catch (error) {
    console.error(`[SecureStorage] Error getting item for key: ${key}`, error);
    // Fallback to AsyncStorage if SecureStore fails
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
}

/**
 * Remove a key securely.
 */
export async function removeSecureItem(key: string): Promise<void> {
  if (!key) {
    return;
  }

  try {
    if (isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`[SecureStorage] Error deleting item for key: ${key}`, error);
    // Fallback to AsyncStorage if SecureStore fails
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('[SecureStorage] Critical: AsyncStorage fallback deletion failed', e);
    }
  }
}
