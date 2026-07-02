/**
 * OnboardingNavigator
 *
 * Linear onboarding flow: Welcome → Walkthrough → Auth → Referral → Locality → Complete.
 * Each screen uses a thin adapter to wire navigation to the existing prop callbacks.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { WalkthroughScreen } from '../screens/onboarding/WalkthroughScreen';
import { PhoneAuthScreen } from '../screens/onboarding/PhoneAuthScreen';
import { ReferralCodeScreen } from '../screens/onboarding/ReferralCodeScreen';
import { LocalitySelectionScreen } from '../screens/onboarding/LocalitySelectionScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';
import { useApp } from '../contexts/AppContext';

import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// ─── Adapters ─────────────────────────────────────────────────────────────────

const WelcomeAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return <WelcomeScreen onNext={() => nav.navigate('Walkthrough')} />;
};

const WalkthroughAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return <WalkthroughScreen onGetStarted={() => nav.navigate('Auth')} />;
};

const AuthAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return (
    <PhoneAuthScreen
      onAuthSuccess={(_role) => nav.navigate('Referral')}
    />
  );
};

const ReferralAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return <ReferralCodeScreen onContinue={() => nav.navigate('Locality')} />;
};

const LocalityAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return <LocalitySelectionScreen onLocalityConfirmed={() => nav.navigate('OnboardingComplete')} />;
};

const OnboardingCompleteAdapter = () => {
  const { login } = useApp();
  return (
    <OnboardingCompleteScreen
      // The login call sets the user in AppContext — RootNavigator reacts and
      // automatically switches to CustomerApp or VendorApp.
      onEnterApp={() => login('08012345678', 'customer', 'New User')}
    />
  );
};

// ─── Navigator ────────────────────────────────────────────────────────────────

export const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Welcome"            component={WelcomeAdapter} />
      <Stack.Screen name="Walkthrough"        component={WalkthroughAdapter} />
      <Stack.Screen name="Auth"               component={AuthAdapter} />
      <Stack.Screen name="Referral"           component={ReferralAdapter} />
      <Stack.Screen name="Locality"           component={LocalityAdapter} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteAdapter} />
    </Stack.Navigator>
  );
};
