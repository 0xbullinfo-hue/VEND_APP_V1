import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AppProvider } from './src/contexts/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { NotificationToast } from './src/components/SharedComponents';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { theme } from './src/theme/designSystem';
import { useThemeStore } from './src/store/useThemeStore';
import { getThemeColors } from './src/theme/themeConfig';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { isDarkMode } = useThemeStore();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts if they exist
      } catch (e) {
        console.warn('Font loading failed:', e);
      } finally {
        // Tell the application to render even if fonts fail
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <AppProvider>
              <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar
                  barStyle={isDarkMode ? "light-content" : "dark-content"}
                  backgroundColor={colors.background}
                />

                {/* React Navigation root — handles all routing */}
                <RootNavigator />

                {/* Global overlay: points earned / SOS notifications */}
                <NotificationToast />
              </View>
            </AppProvider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
  },
  container: {
    flex: 1,
    ...theme.layout.webContainer, // Adds responsive bounding borders on wide web layouts
  },
});
