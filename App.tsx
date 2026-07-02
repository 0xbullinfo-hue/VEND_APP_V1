import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AppProvider } from './src/contexts/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { NotificationToast } from './src/components/SharedComponents';
import { theme } from './src/theme/designSystem';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <AppProvider>
            <View style={styles.container}>
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

              {/* React Navigation root — handles all routing */}
              <RootNavigator />

              {/* Global overlay: points earned / SOS notifications */}
              <NotificationToast />
            </View>
          </AppProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...theme.layout.webContainer, // Adds responsive bounding borders on wide web layouts
  },
});
