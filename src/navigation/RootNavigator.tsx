/**
 * RootNavigator
 *
 * Top-level navigator that gates access based on AppContext user/role state.
 *
 * Structure:
 *   NavigationContainer
 *     └─ RootStack
 *         ├─ Onboarding  (when !user)
 *         ├─ CustomerApp (when user && role === 'customer')
 *         └─ VendorApp   (when user && role === 'vendor')
 *
 * Switching between stacks is done by React Navigation's conditional rendering
 * driven by the user/role values in AppContext. When the user logs out, the
 * context clears user → the Onboarding stack is shown automatically.
 */
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigatorCompat } from './createStackNavigatorCompat';

import { useApp } from '../contexts/AppContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { CustomerStackNavigator } from './CustomerStackNavigator';
import { VendorStackNavigator } from './VendorStackNavigator';
import { BrandedSplashScreen } from '../screens/shared/BrandedSplashScreen';
import { theme } from '../theme/designSystem';

import type { RootStackParamList } from './types';

const Root = createStackNavigatorCompat<RootStackParamList>();

const devLog = (message: string, payload?: unknown) => {
  if (!__DEV__) {
    return;
  }
  if (typeof payload === 'undefined') {
    console.log(`[VEND][RootNavigator] ${message}`);
    return;
  }
  console.log(`[VEND][RootNavigator] ${message}`, payload);
};

export const RootNavigator = () => {
  const { user, role, onboardingCompleted, isHydrated } = useApp();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    if (isHydrated) {
      // Keep branded splash visible for at least 2.5s for professional brand impression
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  React.useEffect(() => {
    let route: 'HydrationLoading' | 'Onboarding' | 'VendorApp' | 'CustomerApp';

    if (!isHydrated) {
      route = 'HydrationLoading';
    } else if (!user || !onboardingCompleted) {
      route = 'Onboarding';
    } else {
      route = role === 'vendor' ? 'VendorApp' : 'CustomerApp';
    }

    devLog('routeDecision', {
      route,
      isHydrated,
      hasUser: !!user,
      role: role ?? null,
      onboardingCompleted,
    });
  }, [isHydrated, user, role, onboardingCompleted]);

  if (!isHydrated || showSplash) {
    return <BrandedSplashScreen />;
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user || !onboardingCompleted ? (
          // ── No session: onboarding flow ────────────────────────────────────
          <Root.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : role === 'vendor' ? (
          // ── Vendor session ────────────────────────────────────────────────
          <Root.Screen name="VendorApp" component={VendorStackNavigator} />
        ) : (
          // ── Customer session (default) ────────────────────────────────────
          <Root.Screen name="CustomerApp" component={CustomerStackNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
};
