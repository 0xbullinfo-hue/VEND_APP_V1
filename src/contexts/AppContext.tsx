import React, { useEffect } from 'react';
import { useAuthStore, useLocationStore, useTripStore, useUIStore, useVendorStore } from '../store';
import { getPlanForTier } from '../lib/subscriptionPlans';

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

  return <>{children}</>;
};

export const useApp = () => {
  const auth = useAuthStore();
  const location = useLocationStore();
  const trip = useTripStore();
  const ui = useUIStore();
  const vendor = useVendorStore();

  const myVendorProfile = vendor.vendors.find(v => v.id === auth.user?.id) ?? null;
  const myVendorPlan = getPlanForTier(myVendorProfile?.subscription_tier);

  return {
    ...auth,
    ...location,
    ...trip,
    ...ui,
    ...vendor,
    myVendorProfile,
    myVendorPlan
  };
};
