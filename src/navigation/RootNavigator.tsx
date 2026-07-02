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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useApp } from '../contexts/AppContext';
import { OnboardingNavigator } from './OnboardingNavigator';
import { CustomerStackNavigator } from './CustomerStackNavigator';
import { VendorStackNavigator } from './VendorStackNavigator';

import type { RootStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { user, role } = useApp();

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
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
