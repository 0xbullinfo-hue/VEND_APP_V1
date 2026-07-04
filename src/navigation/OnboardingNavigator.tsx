/**
 * OnboardingNavigator
 *
 * Linear onboarding flow: Welcome → Privacy → Terms → Walkthrough → Auth → Referral → Locality → Complete.
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
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../screens/legal/TermsOfServiceScreen';
import { useApp } from '../contexts/AppContext';

import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// ─── Adapters ─────────────────────────────────────────────────────────────────

const WelcomeAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return <WelcomeScreen onNext={() => nav.navigate('Privacy')} />;
};

const PrivacyAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return (
    <PrivacyPolicyScreen
      onAccept={() => nav.navigate('Terms')}
      onDecline={() => nav.goBack()}
    />
  );
};

const TermsAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  return (
    <TermsOfServiceScreen
      onAccept={() => nav.navigate('Walkthrough')}
      onDecline={() => nav.goBack()}
    />
  );
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
  const { completeOnboarding } = useApp();
  return (
    <OnboardingCompleteScreen
      // Auth is already established in PhoneAuth; this marks onboarding complete
      // so RootNavigator can route to the appropriate app stack.
      onEnterApp={() => {
        void completeOnboarding();
      }}
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
      <Stack.Screen name="Privacy"            component={PrivacyAdapter} />
      <Stack.Screen name="Terms"              component={TermsAdapter} />
      <Stack.Screen name="Walkthrough"        component={WalkthroughAdapter} />
      <Stack.Screen name="Auth"               component={AuthAdapter} />
      <Stack.Screen name="Referral"           component={ReferralAdapter} />
      <Stack.Screen name="Locality"           component={LocalityAdapter} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteAdapter} />
    </Stack.Navigator>
  );
};
