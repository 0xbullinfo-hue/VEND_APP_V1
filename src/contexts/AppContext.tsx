import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAnalyticsStore, useAuthStore, useLocationStore, useTripStore, useUIStore, useVendorStore } from '../store';
import { useProximityNotificationStore } from '../store/useProximityNotificationStore';
import { getPlanForTier } from '../lib/subscriptionPlans';
import { initializeNetworkMonitoring, subscribeToNetworkChanges } from '../lib/networkConnectivity';
import { initializeErrorReporting, setErrorUser, clearErrorUser } from '../lib/errorReporting';
import { initializeSSLPinning } from '../lib/sslPinning';
import { useProximityEngine } from '../hooks/useProximityEngine';

// Export types so components importing from AppContext don't break
export type { UserProfile, DirectionRequest, EmergencyContact } from '../types';

const devLog = (message: string, payload?: unknown) => {
  if (!__DEV__) {
    return;
  }
  if (typeof payload === 'undefined') {
    console.log(`[VEND][AppContext] ${message}`);
    return;
  }
  console.log(`[VEND][AppContext] ${message}`, payload);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrateAuthSession = useAuthStore((state) => state.hydrateAuthSession);
  const localityId = useLocationStore((state) => state.locality?.id);
  const setLocalityById = useLocationStore((state) => state.setLocalityById);
  const refreshVendorsForLocality = useVendorStore((state) => state.refreshVendorsForLocality);
  const connectVendorRealtime = useVendorStore((state) => state.connectVendorRealtime);
  const hydrateAnalyticsEvents = useAnalyticsStore((state) => state.hydrateAnalyticsEvents);
  const flushPendingEvents = useAnalyticsStore((state) => state.flushPendingEvents);
  const checkAllProximityTriggers = useProximityNotificationStore((state) => state.checkAllProximityTriggers);

  // Initialize hyperlocal proximity engine
  useProximityEngine();

  useEffect(() => {
    devLog('hydrateAuthSession:start');
    void hydrateAuthSession();
  }, [hydrateAuthSession]);

  // Auth session listener for auto-session expiration / signout
  useEffect(() => {
    const unsubscribe = useAuthStore.getState().initAuthListener();
    return () => {
      unsubscribe();
    };
  }, []);

  // Initialize SSL Pinning on app startup
  useEffect(() => {
    devLog('sslPinning:initialize');
    try {
      initializeSSLPinning();
    } catch (e) {
      console.error('[AppContext] Failed to initialize SSL pinning:', e);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    devLog('hydrateAuthSession:done', {
      userId: user?.id ?? null,
      role: user?.role ?? null,
      onboardingLocalityId: user?.localityId ?? null,
    });

    // Set or clear user context in error reporting
    if (user?.id) {
      setErrorUser(user.id, undefined, user.phone);
    } else {
      clearErrorUser();
    }
  }, [isHydrated, user?.id, user?.role, user?.localityId, user?.phone]);

  useEffect(() => {
    if (!isHydrated || !user?.localityId || localityId === user.localityId) {
      return;
    }
    devLog('locality:restoreFromAuthProfile', {
      from: localityId ?? null,
      to: user.localityId,
    });
    setLocalityById(user.localityId);
  }, [isHydrated, user?.localityId, localityId, setLocalityById]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    devLog('vendors:refreshForLocality', { localityId: localityId ?? null });
    void refreshVendorsForLocality(localityId);
  }, [isHydrated, localityId, refreshVendorsForLocality]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    devLog('vendors:realtime:connect', { localityId: localityId ?? null });
    const cleanup = connectVendorRealtime(localityId);
    return () => {
      devLog('vendors:realtime:disconnect', { localityId: localityId ?? null });
      cleanup();
    };
  }, [isHydrated, localityId, connectVendorRealtime]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void hydrateAnalyticsEvents(user?.id ?? null);
  }, [isHydrated, user?.id, hydrateAnalyticsEvents]);

  // Periodic analytics queue flush (foreground + every 5 minutes)
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Flush on app foreground
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        devLog('appState:foreground -> flushPendingEvents');
        void flushPendingEvents();
      }
    });

    // Periodic flush every 5 minutes
    const intervalId = setInterval(() => {
      devLog('periodicFlush:5min -> flushPendingEvents');
      void flushPendingEvents();
    }, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [isHydrated, flushPendingEvents]);

  // Initialize network monitoring on app startup
  useEffect(() => {
    devLog('networkMonitoring:initialize');
    void initializeNetworkMonitoring();
  }, []);

  // Initialize error reporting on app startup
  useEffect(() => {
    devLog('errorReporting:initialize');
    const sentryDSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
    initializeErrorReporting(sentryDSN);
  }, []);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = subscribeToNetworkChanges((networkState) => {
      devLog('networkMonitoring:changed', { isConnected: networkState.isConnected, type: networkState.type });
      useAnalyticsStore.getState().setNetworkAvailable(networkState.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Periodic proximity checks (every 30 seconds when app is active)
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const vendors = useVendorStore.getState().vendors;
    // TODO: Get customers and their locations from app state once available
    // For now, this serves as the integration point
    const customers: any[] = [];
    const customerLocations = new Map();

    // Proximity check on app foreground
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        devLog('appState:foreground -> checkProximityTriggers');
        // Trigger proximity checks
        if (vendors.length > 0 && customers.length > 0) {
          checkAllProximityTriggers(vendors, customers, customerLocations, []);
        }
      }
    });

    // Periodic proximity checks every 30 seconds (less aggressive than analytics)
    const intervalId = setInterval(() => {
      devLog('periodicProximityCheck:30s');
      if (vendors.length > 0 && customers.length > 0) {
        checkAllProximityTriggers(vendors, customers, customerLocations, []);
      }
    }, 30 * 1000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [isHydrated, checkAllProximityTriggers]);

  return <>{children}</>;
};

export const useApp = () => {
  const auth = useAuthStore();
  const location = useLocationStore();
  const trip = useTripStore();
  const ui = useUIStore();
  const vendor = useVendorStore();
  const analytics = useAnalyticsStore();

  const myVendorProfile = vendor.vendors.find(v => v.id === auth.user?.id) ?? null;
  const myVendorPlan = getPlanForTier(myVendorProfile?.subscription_tier);

  return {
    ...auth,
    ...location,
    ...trip,
    ...ui,
    ...vendor,
    ...analytics,
    myVendorProfile,
    myVendorPlan
  };
};
