import React from 'react';
import { useAuthStore, useLocationStore, useTripStore, useUIStore, useVendorStore } from '../store';
import { getPlanForTier } from '../lib/subscriptionPlans';

// Export types so components importing from AppContext don't break
export type { UserProfile, DirectionRequest, EmergencyContact } from '../types';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
