import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme, normalize } from '../theme/designSystem';

// Screens
import { VendorDashboardScreen } from '../screens/vendor/VendorDashboardScreen';
import { ProductManagementScreen } from '../screens/vendor/ProductManagementScreen';
import { VendorGrowthScreen } from '../screens/vendor/VendorGrowthScreen';
import { VendorProfileScreen } from '../screens/vendor/VendorProfileScreen';

const Tab = createBottomTabNavigator();

export const VendorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'grid-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Services') iconName = focused ? 'storefront' : 'storefront-outline';
          else if (route.name === 'Growth') iconName = focused ? 'trending-up' : 'trending-up-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
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
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={VendorDashboardScreen} />
      <Tab.Screen name="Services" component={ProductManagementScreen} />
      <Tab.Screen name="Growth" component={VendorGrowthScreen} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
};
