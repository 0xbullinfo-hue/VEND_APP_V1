import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../contexts/AppContext';

// Navigators
import { UserTabNavigator } from './UserTabNavigator';
import { VendorTabNavigator } from './VendorTabNavigator';

// Onboarding Screens
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { WalkthroughScreen } from '../screens/onboarding/WalkthroughScreen';
import { PhoneAuthScreen } from '../screens/onboarding/PhoneAuthScreen';
import { ReferralCodeScreen } from '../screens/onboarding/ReferralCodeScreen';
import { LocalitySelectionScreen } from '../screens/onboarding/LocalitySelectionScreen';
import { OnboardingCompleteScreen } from '../screens/onboarding/OnboardingCompleteScreen';

// Overlay Screens
import { LiveTripScreen } from '../screens/customer/LiveTripScreen';
import { DirectionRequestScreen } from '../screens/customer/DirectionRequestScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { LeaveReviewScreen } from '../screens/customer/LeaveReviewScreen';
import { VendorProfileScreen } from '../screens/customer/VendorProfileScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, role } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!user ? (
          // Onboarding Stack
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Walkthrough" component={WalkthroughScreen} />
            <Stack.Screen name="Auth" component={PhoneAuthScreen} />
            <Stack.Screen name="Referral" component={ReferralCodeScreen} />
            <Stack.Screen name="Locality" component={LocalitySelectionScreen} />
            <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
          </Stack.Group>
        ) : (
          // Main App Stack
          <Stack.Group>
            <Stack.Screen 
              name="MainTabs" 
              component={role === 'vendor' ? VendorTabNavigator : UserTabNavigator} 
            />
            {/* Modal/Overlay Screens */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name="VendorProfileOverlay" component={VendorProfileScreen} />
              <Stack.Screen name="DirectionRequest" component={DirectionRequestScreen} />
              <Stack.Screen name="LiveTrip" component={LiveTripScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="LeaveReview" component={LeaveReviewScreen} />
            </Stack.Group>
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
