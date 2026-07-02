/**
 * CustomerStackNavigator
 *
 * Hosts the customer bottom tabs plus all full-screen overlay screens:
 * VendorProfile, Directions, LiveTrip, QRScanner, LeaveReview, Chat, PointsHistory.
 *
 * These overlays slide in on top of the tabs, giving full Android back-button
 * support and proper screen transition animations.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { UserTabNavigator } from './UserTabNavigator';

// Overlay screens
import { VendorProfileScreen } from '../screens/customer/VendorProfileScreen';
import { DirectionRequestScreen } from '../screens/customer/DirectionRequestScreen';
import { LiveTripScreen } from '../screens/customer/LiveTripScreen';
import { QRScannerScreen } from '../screens/customer/QRScannerScreen';
import { LeaveReviewScreen } from '../screens/customer/LeaveReviewScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { PointsHistoryScreen } from '../screens/PointsHistoryScreen';

import type { CustomerStackParamList } from './types';
import { useApp } from '../contexts/AppContext';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

// ─── Overlay adapters ─────────────────────────────────────────────────────────

const VendorProfileAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const route = useRoute<NativeStackScreenProps<CustomerStackParamList, 'VendorProfile'>['route']>();
  return (
    <VendorProfileScreen
      vendorId={route.params.vendorId}
      onBack={() => nav.goBack()}
      onRequestDirections={(vId) => {
        nav.goBack();
        nav.navigate('DirectionRequest', { vendorId: vId });
      }}
      onLeaveReview={(vId) => {
        nav.goBack();
        nav.navigate('LeaveReview', { vendorId: vId });
      }}
      onStartChat={(vId) => {
        nav.goBack();
        nav.navigate('Chat', { recipientId: vId });
      }}
    />
  );
};

const DirectionRequestAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const route = useRoute<NativeStackScreenProps<CustomerStackParamList, 'DirectionRequest'>['route']>();
  return (
    <DirectionRequestScreen
      vendorId={route.params.vendorId}
      onBack={() => nav.goBack()}
      onStartTrip={() => {
        nav.goBack();
        nav.navigate('LiveTrip');
      }}
    />
  );
};

const LiveTripAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const { activeTrip } = useApp();
  return (
    <LiveTripScreen
      onTripEnd={() => nav.goBack()}
      onArrived={() => {
        if (activeTrip) {
          nav.navigate('QRScanner', { vendorId: activeTrip.vendorId });
        }
      }}
    />
  );
};

const QRScannerAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const route = useRoute<NativeStackScreenProps<CustomerStackParamList, 'QRScanner'>['route']>();
  const { completeTrip } = useApp();
  return (
    <QRScannerScreen
      vendorId={route.params.vendorId}
      onCancel={() => nav.goBack()}
      onScanSuccess={() => {
        completeTrip();
        nav.navigate('LeaveReview', { vendorId: route.params.vendorId });
      }}
    />
  );
};

const LeaveReviewAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const route = useRoute<NativeStackScreenProps<CustomerStackParamList, 'LeaveReview'>['route']>();
  return (
    <LeaveReviewScreen
      vendorId={route.params.vendorId}
      onBack={() => nav.navigate('CustomerTabs')}
    />
  );
};

const ChatAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const route = useRoute<NativeStackScreenProps<CustomerStackParamList, 'Chat'>['route']>();
  return (
    <ChatScreen
      recipientId={route.params.recipientId}
      onBack={() => nav.goBack()}
      onNavigateToDirections={() => {
        const vId = route.params.recipientId;
        nav.goBack();
        nav.navigate('DirectionRequest', { vendorId: vId });
      }}
    />
  );
};

const PointsHistoryAdapter = () => {
  const nav = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  return (
    <PointsHistoryScreen
      onBack={() => nav.goBack()}
    />
  );
};

// ─── Stack Navigator ──────────────────────────────────────────────────────────

export const CustomerStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      {/* Tab root */}
      <Stack.Screen name="CustomerTabs" component={UserTabNavigator} />

      {/* Full-screen overlays */}
      <Stack.Screen name="VendorProfile"    component={VendorProfileAdapter} />
      <Stack.Screen name="DirectionRequest" component={DirectionRequestAdapter} />
      <Stack.Screen name="LiveTrip"         component={LiveTripAdapter} />
      <Stack.Screen name="QRScanner"        component={QRScannerAdapter} options={{ animation: 'fade' }} />
      <Stack.Screen name="LeaveReview"      component={LeaveReviewAdapter} />
      <Stack.Screen name="Chat"             component={ChatAdapter} />
      <Stack.Screen name="PointsHistory"    component={PointsHistoryAdapter} />
    </Stack.Navigator>
  );
};
