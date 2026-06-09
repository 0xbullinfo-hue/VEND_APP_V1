import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { AppProvider, useApp } from './src/contexts/AppContext';
import { theme, normalize } from './src/theme/designSystem';
import { VText, NotificationToast } from './src/components/SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';

// Import Screens
import { WelcomeScreen } from './src/screens/onboarding/WelcomeScreen';
import { WalkthroughScreen } from './src/screens/onboarding/WalkthroughScreen';
import { PhoneAuthScreen } from './src/screens/onboarding/PhoneAuthScreen';
import { ReferralCodeScreen } from './src/screens/onboarding/ReferralCodeScreen';
import { LocalitySelectionScreen } from './src/screens/onboarding/LocalitySelectionScreen';
import { OnboardingCompleteScreen } from './src/screens/onboarding/OnboardingCompleteScreen';

import { HomeScreen } from './src/screens/customer/HomeScreen';
import { ExploreScreen } from './src/screens/customer/ExploreScreen';
import { RewardsScreen } from './src/screens/customer/RewardsScreen';
import { CustomerProfileScreen } from './src/screens/customer/CustomerProfileScreen';

import { VendorProfileScreen } from './src/screens/customer/VendorProfileScreen';
import { DirectionRequestScreen } from './src/screens/customer/DirectionRequestScreen';
import { LiveTripScreen } from './src/screens/customer/LiveTripScreen';
import { LeaveReviewScreen } from './src/screens/customer/LeaveReviewScreen';
import { QRScannerScreen } from './src/screens/customer/QRScannerScreen';
import { PointsHistoryScreen } from './src/screens/PointsHistoryScreen';

import { VendorDashboardScreen } from './src/screens/vendor/VendorDashboardScreen';
import { ProductManagementScreen } from './src/screens/vendor/ProductManagementScreen';
import { SubscriptionManagerScreen } from './src/screens/vendor/SubscriptionManagerScreen';
import { VendorGrowthScreen } from './src/screens/vendor/VendorGrowthScreen';
import { VendorProfileScreen as VendorAccountScreen } from './src/screens/vendor/VendorProfileScreen';
import { DetailedLocationSetupScreen } from './src/screens/vendor/DetailedLocationSetupScreen';
import { RegistrationSuccessScreen } from './src/screens/vendor/RegistrationSuccessScreen';

import { ChatScreen } from './src/screens/shared/ChatScreen';

type OnboardingSteps = 'welcome' | 'walkthrough' | 'auth' | 'referral' | 'locality' | 'complete';
type CustomerTabs = 'home' | 'explore' | 'rewards' | 'profile';
type VendorTabs = 'dashboard' | 'services' | 'growth' | 'profile';

// Navigation Manager Component
const AppNavigation: React.FC = () => {
  const { user, role, login, activeTrip, completeTrip } = useApp();
  
  // Local stack routing state
  const [onboardingStep, setOnboardingStep] = useState<OnboardingSteps>('welcome');
  const [activeCustomerTab, setActiveCustomerTab] = useState<CustomerTabs>('home');
  const [activeVendorTab, setActiveVendorTab] = useState<VendorTabs>('dashboard');
  
  const [activeVendorProfileId, setActiveVendorProfileId] = useState<string | null>(null);
  const [activeDirectionsVendorId, setActiveDirectionsVendorId] = useState<string | null>(null);
  const [isLiveTripActive, setIsLiveTripActive] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [isViewingPointsLedger, setIsViewingPointsLedger] = useState(false);
  const [activeChatRecipientId, setActiveChatRecipientId] = useState<string | null>(null);
  
  // Registration mock state
  const [mockRegStep, setMockRegStep] = useState<'none' | 'location' | 'success'>('none');
  const [activeReviewVendorId, setActiveReviewVendorId] = useState<string | null>(null);

  // Vendor stack state
  const [isManagingProducts, setIsManagingProducts] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  // Deep Linking Handler
  React.useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      let data = Linking.parse(event.url);
      if (data.path === 'profile' && data.queryParams?.id) {
        // Handle vendapp://profile?id=v2
        setActiveVendorProfileId(data.queryParams.id as string);
      } else if (data.path === 'referral') {
        // Handle vendapp://referral
        if (!user) {
          setOnboardingStep('referral');
        }
      }
    };
    
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [user]);

  // Determine view state
  if (!user) {
    // 1. Onboarding Screen Flow Stack
    switch (onboardingStep) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setOnboardingStep('walkthrough')} />;
      case 'walkthrough':
        return <WalkthroughScreen onGetStarted={() => setOnboardingStep('auth')} />;
      case 'auth':
        return <PhoneAuthScreen onAuthSuccess={() => setOnboardingStep('referral')} />;
      case 'referral':
        return <ReferralCodeScreen onContinue={() => setOnboardingStep('locality')} />;
      case 'locality':
        return <LocalitySelectionScreen onLocalityConfirmed={() => setOnboardingStep('complete')} />;
      case 'complete':
        return <OnboardingCompleteScreen onEnterApp={() => login("08012345678", "customer", "Adeolu O.")} />;
    }
  }

  // 2. Overlays on top of main apps (Active Navigation, Profile View, Chat)
  if (isViewingPointsLedger) {
    return <PointsHistoryScreen onBack={() => setIsViewingPointsLedger(false)} />;
  }

  if (isScanningQR && activeTrip) {
    return (
      <QRScannerScreen
        vendorId={activeTrip.vendorId}
        onCancel={() => setIsScanningQR(false)}
        onScanSuccess={() => {
          setIsScanningQR(false);
          setIsLiveTripActive(false);
          completeTrip();
          setActiveReviewVendorId(activeTrip.vendorId);
        }}
      />
    );
  }

  if (isLiveTripActive) {
    return (
      <LiveTripScreen 
        onTripEnd={() => setIsLiveTripActive(false)} 
        onArrived={() => setIsScanningQR(true)}
      />
    );
  }

  if (activeDirectionsVendorId) {
    return (
      <DirectionRequestScreen
        vendorId={activeDirectionsVendorId}
        onBack={() => setActiveDirectionsVendorId(null)}
        onStartTrip={() => {
          setActiveDirectionsVendorId(null);
          setIsLiveTripActive(true);
        }}
      />
    );
  }

  if (activeChatRecipientId) {
    return (
      <ChatScreen
        recipientId={activeChatRecipientId}
        onBack={() => setActiveChatRecipientId(null)}
        onNavigateToDirections={() => {
          const vId = activeChatRecipientId;
          setActiveChatRecipientId(null);
          setActiveDirectionsVendorId(vId);
        }}
      />
    );
  }

  if (activeReviewVendorId) {
    return (
      <LeaveReviewScreen
        vendorId={activeReviewVendorId}
        onBack={() => setActiveReviewVendorId(null)}
      />
    );
  }

  if (activeVendorProfileId) {
    return (
      <VendorProfileScreen
        vendorId={activeVendorProfileId}
        onBack={() => setActiveVendorProfileId(null)}
        onRequestDirections={(vId) => {
          setActiveVendorProfileId(null);
          setActiveDirectionsVendorId(vId);
        }}
        onLeaveReview={(vId) => {
          setActiveVendorProfileId(null);
          setActiveReviewVendorId(vId);
        }}
        onStartChat={(vId) => {
          setActiveVendorProfileId(null);
          setActiveChatRecipientId(vId);
        }}
      />
    );
  }

  // 3. Vendor Account Stack Views
  if (role === 'vendor') {
    if (isManagingSubscription) {
      return <SubscriptionManagerScreen onBack={() => setIsManagingSubscription(false)} />;
    }

    return (
      <SafeAreaView style={styles.appContainer}>
        <View style={{ flex: 1 }}>
          {activeVendorTab === 'dashboard' && (
            <VendorDashboardScreen
              onManageProducts={() => setActiveVendorTab('services')}
              onManageSubscription={() => setIsManagingSubscription(true)}
              onLogout={() => setOnboardingStep('welcome')}
              onStartChat={(custId) => setActiveChatRecipientId(custId)}
              onViewGrowth={() => setIsViewingPointsLedger(true)}
              onViewProfile={() => setActiveVendorTab('profile')}
            />
          )}
          {activeVendorTab === 'services' && (
            <ProductManagementScreen 
              onBack={() => setActiveVendorTab('dashboard')} 
            />
          )}
          {activeVendorTab === 'growth' && (
            <VendorGrowthScreen onBack={() => setActiveVendorTab('dashboard')} />
          )}
          {activeVendorTab === 'profile' && (
            <VendorAccountScreen 
              onBack={() => setActiveVendorTab('dashboard')}
              onLogout={() => setOnboardingStep('welcome')}
              onTestRegistration={() => setMockRegStep('location')}
            />
          )}
        </View>

        {/* Vendor Bottom Tab Bar */}
        <View style={[styles.bottomTabBar, theme.shadows.premium]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveVendorTab('dashboard')}
            style={styles.tabItem}
          >
            <Ionicons 
              name={activeVendorTab === 'dashboard' ? "grid" : "grid-outline"} 
              size={normalize(20)} 
              color={activeVendorTab === 'dashboard' ? theme.colors.primary : theme.colors.textMuted} 
            />
            <VText 
              variant="caption" 
              color={activeVendorTab === 'dashboard' ? theme.colors.primary : theme.colors.textMuted}
              style={{ marginTop: 2, fontSize: normalize(9) }}
            >
              Dashboard
            </VText>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveVendorTab('services')}
            style={styles.tabItem}
          >
            <Ionicons 
              name={activeVendorTab === 'services' ? "storefront" : "storefront-outline"} 
              size={normalize(20)} 
              color={activeVendorTab === 'services' ? theme.colors.primary : theme.colors.textMuted} 
            />
            <VText 
              variant="caption" 
              color={activeVendorTab === 'services' ? theme.colors.primary : theme.colors.textMuted}
              style={{ marginTop: 2, fontSize: normalize(9) }}
            >
              Services
            </VText>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveVendorTab('growth')}
            style={styles.tabItem}
          >
            <Ionicons 
              name={activeVendorTab === 'growth' ? "trending-up" : "trending-up-outline"} 
              size={normalize(20)} 
              color={activeVendorTab === 'growth' ? theme.colors.primary : theme.colors.textMuted} 
            />
            <VText 
              variant="caption" 
              color={activeVendorTab === 'growth' ? theme.colors.primary : theme.colors.textMuted}
              style={{ marginTop: 2, fontSize: normalize(9) }}
            >
              Growth
            </VText>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setActiveVendorTab('profile')}
            style={styles.tabItem}
          >
            <Ionicons 
              name={activeVendorTab === 'profile' ? "person" : "person-outline"} 
              size={normalize(20)} 
              color={activeVendorTab === 'profile' ? theme.colors.primary : theme.colors.textMuted} 
            />
            <VText 
              variant="caption" 
              color={activeVendorTab === 'profile' ? theme.colors.primary : theme.colors.textMuted}
              style={{ marginTop: 2, fontSize: normalize(9) }}
            >
              Profile
            </VText>
          </TouchableOpacity>
        </View>

        {/* Registration Mock Overlay */}
        {mockRegStep === 'location' && (
          <View style={StyleSheet.absoluteFill}>
            <DetailedLocationSetupScreen
              onBack={() => setMockRegStep('none')}
              onComplete={() => setMockRegStep('success')}
            />
          </View>
        )}
        {mockRegStep === 'success' && (
          <View style={StyleSheet.absoluteFill}>
            <RegistrationSuccessScreen
              onGoToDashboard={() => {
                setMockRegStep('none');
                setActiveVendorTab('dashboard');
              }}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  // 4. Customer Account Tab View Navigation
  return (
    <View style={styles.appContainer}>
      <View style={{ flex: 1 }}>
        {activeCustomerTab === 'home' && (
          <HomeScreen
            onExploreCategories={() => setActiveCustomerTab('explore')}
            onViewVendorProfile={(vId) => setActiveVendorProfileId(vId)}
            onViewRewards={() => setActiveCustomerTab('rewards')}
          />
        )}
        {activeCustomerTab === 'explore' && (
          <ExploreScreen
            onBackToHome={() => setActiveCustomerTab('home')}
            onViewVendorProfile={(vId) => setActiveVendorProfileId(vId)}
            onViewRewards={() => setActiveCustomerTab('rewards')}
          />
        )}
        {activeCustomerTab === 'rewards' && (
          <RewardsScreen
            onBackToHome={() => setActiveCustomerTab('home')}
          />
        )}
        {activeCustomerTab === 'profile' && (
          <CustomerProfileScreen
            onBackToHome={() => setActiveCustomerTab('home')}
            onSwitchToVendor={async () => {
              // Toggle role status inside context to vendor
              await login(user.phone, 'vendor', user.name);
            }}
            onViewVendorProfile={(vId) => setActiveVendorProfileId(vId)}
            onLogout={() => setOnboardingStep('welcome')}
            onViewPointsLedger={() => setIsViewingPointsLedger(true)}
          />
        )}
      </View>

      {/* Styled Bottom Tab Bar */}
      <View style={[styles.bottomTabBar, theme.shadows.premium]}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveCustomerTab('home')}
          style={styles.tabItem}
        >
          <Ionicons 
            name={activeCustomerTab === 'home' ? "storefront" : "storefront-outline"} 
            size={normalize(20)} 
            color={activeCustomerTab === 'home' ? theme.colors.primary : theme.colors.textMuted} 
          />
          <VText 
            variant="caption" 
            color={activeCustomerTab === 'home' ? theme.colors.primary : theme.colors.textMuted}
            style={{ marginTop: 2, fontSize: normalize(9) }}
          >
            Vendors
          </VText>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveCustomerTab('explore')}
          style={styles.tabItem}
        >
          <Ionicons 
            name={activeCustomerTab === 'explore' ? "grid" : "grid-outline"} 
            size={normalize(20)} 
            color={activeCustomerTab === 'explore' ? theme.colors.primary : theme.colors.textMuted} 
          />
          <VText 
            variant="caption" 
            color={activeCustomerTab === 'explore' ? theme.colors.primary : theme.colors.textMuted}
            style={{ marginTop: 2, fontSize: normalize(9) }}
          >
            Explore
          </VText>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveCustomerTab('rewards')}
          style={styles.tabItem}
        >
          <Ionicons 
            name={activeCustomerTab === 'rewards' ? "gift" : "gift-outline"} 
            size={normalize(20)} 
            color={activeCustomerTab === 'rewards' ? theme.colors.primary : theme.colors.textMuted} 
          />
          <VText 
            variant="caption" 
            color={activeCustomerTab === 'rewards' ? theme.colors.primary : theme.colors.textMuted}
            style={{ marginTop: 2, fontSize: normalize(9) }}
          >
            Rewards
          </VText>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setActiveCustomerTab('profile')}
          style={styles.tabItem}
        >
          <Ionicons 
            name={activeCustomerTab === 'profile' ? "person" : "person-outline"} 
            size={normalize(20)} 
            color={activeCustomerTab === 'profile' ? theme.colors.primary : theme.colors.textMuted} 
          />
          <VText 
            variant="caption" 
            color={activeCustomerTab === 'profile' ? theme.colors.primary : theme.colors.textMuted}
            style={{ marginTop: 2, fontSize: normalize(9) }}
          >
            Profile
          </VText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          
          {/* Navigation Layer */}
          <AppNavigation />

          {/* Global Notification system alerts */}
          <NotificationToast />
        </View>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...theme.layout.webContainer, // Adds responsive bounding borders on wide web layouts
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
    bottomTabBar: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? normalize(32) : normalize(40),
      left: normalize(16),
      right: normalize(16),
      height: normalize(60),
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      borderRadius: normalize(16),
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
      zIndex: 99,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  logoutBtn: {
    padding: 4,
  },
});
