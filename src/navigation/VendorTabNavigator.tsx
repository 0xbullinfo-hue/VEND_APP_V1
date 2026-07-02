import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '../components/VIcons';
import { theme, normalize } from '../theme/designSystem';
import { useApp } from '../contexts/AppContext';

// Screens
import { VendorDashboardScreen } from '../screens/vendor/VendorDashboardScreen';
import { ProductManagementScreen } from '../screens/vendor/ProductManagementScreen';
import { VendorGrowthScreen } from '../screens/vendor/VendorGrowthScreen';
import { VendorProfileScreen } from '../screens/vendor/VendorProfileScreen';

import type { VendorStackParamList, VendorTabParamList } from './types';

const Tab = createBottomTabNavigator<VendorTabParamList>();

// ─── Thin adapter wrappers ────────────────────────────────────────────────────

const DashboardAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<VendorStackParamList>>();
  const { logout } = useApp();
  return (
    <VendorDashboardScreen
      onManageProducts={() => nav.navigate('VendorTabs')}
      onManageSubscription={() => nav.navigate('SubscriptionManager')}
      onLogout={() => logout()}
      onStartChat={(_custId) => {
        // TODO: Wire to shared Chat screen when customer→vendor chat is built
      }}
      onViewGrowth={() => nav.navigate('VendorTabs')}
      onViewProfile={() => nav.navigate('VendorTabs')}
    />
  );
};

const ServicesAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<VendorStackParamList>>();
  return (
    <ProductManagementScreen
      onBack={() => nav.navigate('VendorTabs')}
      onUpgrade={() => nav.navigate('SubscriptionManager')}
    />
  );
};

const GrowthAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<VendorStackParamList>>();
  return (
    <VendorGrowthScreen
      onBack={() => nav.navigate('VendorTabs')}
    />
  );
};

const VendorProfileAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<VendorStackParamList>>();
  return (
    <VendorProfileScreen
      onBack={() => nav.navigate('VendorTabs')}
      onTestRegistration={() => nav.navigate('LocationSetup')}
      onLogout={() => { /* logout handled inside VendorProfileScreen via useApp */ }}
    />
  );
};

// ─── Tab Navigator ────────────────────────────────────────────────────────────

export const VendorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          let iconName: string = 'grid-outline';
          if (route.name === 'Dashboard')    iconName = focused ? 'grid'         : 'grid-outline';
          else if (route.name === 'Services') iconName = focused ? 'storefront'  : 'storefront-outline';
          else if (route.name === 'Growth')   iconName = focused ? 'trending-up' : 'trending-up-outline';
          else if (route.name === 'VendorProfile') iconName = focused ? 'person' : 'person-outline';
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
      <Tab.Screen name="Dashboard"     component={DashboardAdapter} />
      <Tab.Screen name="Services"      component={ServicesAdapter} />
      <Tab.Screen name="Growth"        component={GrowthAdapter} />
      <Tab.Screen name="VendorProfile" component={VendorProfileAdapter} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};
