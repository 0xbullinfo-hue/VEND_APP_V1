import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { theme, normalize } from '../theme/designSystem';

// Screens
import { HomeScreen } from '../screens/customer/HomeScreen';
import { ExploreScreen } from '../screens/customer/ExploreScreen';
import { RewardsScreen } from '../screens/customer/RewardsScreen';
import { CustomerProfileScreen } from '../screens/customer/CustomerProfileScreen';

const Tab = createBottomTabNavigator();

export const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'storefront-outline';
          if (route.name === 'Vendors') iconName = focused ? 'storefront' : 'storefront-outline';
          else if (route.name === 'Explore') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Rewards') iconName = focused ? 'gift' : 'gift-outline';
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
      <Tab.Screen name="Vendors" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Profile" component={CustomerProfileScreen} />
    </Tab.Navigator>
  );
};
