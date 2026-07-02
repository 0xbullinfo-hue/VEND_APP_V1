import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '../components/VIcons';
import { theme, normalize } from '../theme/designSystem';
import { useApp } from '../contexts/AppContext';

// Screens
import { HomeScreen } from '../screens/customer/HomeScreen';
import { ExploreScreen } from '../screens/customer/ExploreScreen';
import { RewardsScreen } from '../screens/customer/RewardsScreen';
import { CustomerProfileScreen } from '../screens/customer/CustomerProfileScreen';

import type { CustomerTabParamList } from './types';

const Tab = createBottomTabNavigator<CustomerTabParamList>();

// ─── Thin adapter wrappers ────────────────────────────────────────────────────
// These keep all existing screen prop contracts intact while wiring navigation
// actions to React Navigation. No screen code changes required.

const HomeAdapter = () => {
  const nav = useNavigation<any>();
  return (
    <HomeScreen
      onExploreCategories={() => nav.navigate('Explore')}
      onViewVendorProfile={(vId) => nav.navigate('VendorProfile', { vendorId: vId })}
      onViewRewards={() => nav.navigate('Rewards')}
    />
  );
};

const ExploreAdapter = () => {
  const nav = useNavigation<any>();
  return (
    <ExploreScreen
      onBackToHome={() => nav.navigate('Vendors')}
      onViewVendorProfile={(vId) => nav.navigate('VendorProfile', { vendorId: vId })}
      onViewRewards={() => nav.navigate('Rewards')}
    />
  );
};

const RewardsAdapter = () => {
  const nav = useNavigation<any>();
  return (
    <RewardsScreen
      onBackToHome={() => nav.navigate('Vendors')}
    />
  );
};

const CustomerProfileAdapter = () => {
  const nav = useNavigation<any>();
  const { login, user } = useApp();
  return (
    <CustomerProfileScreen
      onBackToHome={() => nav.navigate('Vendors')}
      onSwitchToVendor={async () => {
        if (user) await login(user.phone, 'vendor', user.name);
      }}
      onViewVendorProfile={(vId) => nav.navigate('VendorProfile', { vendorId: vId })}
      onLogout={() => {
        // AppContext.logout() clears the user — RootNavigator reacts and shows Onboarding
      }}
      onViewPointsLedger={() => nav.navigate('PointsHistory')}
    />
  );
};

// ─── Tab Navigator ────────────────────────────────────────────────────────────

export const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: string = 'storefront-outline';
          if (route.name === 'Vendors')  iconName = focused ? 'storefront'        : 'storefront-outline';
          else if (route.name === 'Explore') iconName = focused ? 'grid'          : 'grid-outline';
          else if (route.name === 'Rewards') iconName = focused ? 'gift'          : 'gift-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person'        : 'person-outline';
          return <Ionicons name={iconName as any} size={normalize(20)} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? normalize(32) : normalize(40),
          left: normalize(16),
          right: normalize(16),
          height: normalize(60),
          backgroundColor: '#FFFFFF',
          borderRadius: normalize(16),
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 15 : 5,
          paddingTop: 5,
          ...theme.shadows.premium,
        },
        tabBarLabelStyle: {
          fontSize: normalize(9),
          fontWeight: '700',
          fontFamily: theme.typography.fontSans,
        },
      })}
    >
      <Tab.Screen name="Vendors"  component={HomeAdapter} />
      <Tab.Screen name="Explore"  component={ExploreAdapter} />
      <Tab.Screen name="Rewards"  component={RewardsAdapter} />
      <Tab.Screen name="Profile"  component={CustomerProfileAdapter} />
    </Tab.Navigator>
  );
};
