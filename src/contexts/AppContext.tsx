import React, { useEffect } from 'react';
import { useAuthStore, useLocationStore, useTripStore, useUIStore, useVendorStore } from '../store';
import { getPlanForTier } from '../lib/subscriptionPlans';

// Export types so components importing from AppContext don't break
export type { UserProfile, DirectionRequest, EmergencyContact } from '../types';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrateAuthSession = useAuthStore((state) => state.hydrateAuthSession);
  const localityId = useLocationStore((state) => state.locality?.id);
  const refreshVendorsForLocality = useVendorStore((state) => state.refreshVendorsForLocality);
  const connectVendorRealtime = useVendorStore((state) => state.connectVendorRealtime);

  useEffect(() => {
    void hydrateAuthSession();
  }, [hydrateAuthSession]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    void refreshVendorsForLocality(localityId);
  }, [isHydrated, localityId, refreshVendorsForLocality]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const cleanup = connectVendorRealtime(localityId);
    return () => cleanup();
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
