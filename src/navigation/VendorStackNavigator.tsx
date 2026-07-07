/**
 * VendorStackNavigator
 *
 * Hosts the vendor bottom tabs plus modal/full-screen overlay screens:
 * SubscriptionManager, LocationSetup, RegistrationSuccess.
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigatorCompat } from './createStackNavigatorCompat';
import type { StackNavigationProp } from './createStackNavigatorCompat';

import { VendorTabNavigator } from './VendorTabNavigator';

// Overlay screens
import { SubscriptionManagerScreen } from '../screens/vendor/SubscriptionManagerScreen';
import { DetailedLocationSetupScreen } from '../screens/vendor/DetailedLocationSetupScreen';
import { RegistrationSuccessScreen } from '../screens/vendor/RegistrationSuccessScreen';

import type { VendorStackParamList } from './types';

const Stack = createStackNavigatorCompat<VendorStackParamList>();

// ─── Overlay adapters ─────────────────────────────────────────────────────────

const SubscriptionManagerAdapter = () => {
  const nav = useNavigation<StackNavigationProp<VendorStackParamList>>();
  return (
    <SubscriptionManagerScreen
      onBack={() => nav.goBack()}
    />
  );
};

const LocationSetupAdapter = () => {
  const nav = useNavigation<StackNavigationProp<VendorStackParamList>>();
  return (
    <DetailedLocationSetupScreen
      onBack={() => nav.goBack()}
      onComplete={() => nav.navigate('RegistrationSuccess')}
    />
  );
};

const RegistrationSuccessAdapter = () => {
  const nav = useNavigation<StackNavigationProp<VendorStackParamList>>();
  return (
    <RegistrationSuccessScreen
      onGoToDashboard={() => nav.navigate('VendorTabs')}
    />
  );
};

// ─── Stack Navigator ──────────────────────────────────────────────────────────

export const VendorStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      {/* Tab root */}
      <Stack.Screen name="VendorTabs" component={VendorTabNavigator} />

      {/* Full-screen overlays */}
      <Stack.Screen name="SubscriptionManager" component={SubscriptionManagerAdapter} />
      <Stack.Screen name="LocationSetup"       component={LocationSetupAdapter} />
      <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessAdapter} options={{ animation: 'fade' }} />
    </Stack.Navigator>
  );
};
