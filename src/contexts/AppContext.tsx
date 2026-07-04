import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAnalyticsStore, useAuthStore, useLocationStore, useTripStore, useUIStore, useVendorStore } from '../store';
import { getPlanForTier } from '../lib/subscriptionPlans';
import { initializeNetworkMonitoring, subscribeToNetworkChanges } from '../lib/networkConnectivity';

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

  useEffect(() => {
    devLog('hydrateAuthSession:start');
    void hydrateAuthSession();
  }, [hydrateAuthSession]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    devLog('hydrateAuthSession:done', {
      userId: user?.id ?? null,
      role: user?.role ?? null,
      onboardingLocalityId: user?.localityId ?? null,
    });
  }, [isHydrated, user?.id, user?.role, user?.localityId]);

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
