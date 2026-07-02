import { create } from 'zustand';
import { UserProfile } from '../types';
import { useUIStore } from './useUIStore';
import { useVendorStore } from './useVendorStore';
import { useTripStore } from './useTripStore';
import { useLocationStore } from './useLocationStore';

interface AuthState {
  user: UserProfile | null;
  role: 'customer' | 'vendor' | null;
  login: (phone: string, role: 'customer' | 'vendor', name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,

  login: async (phone, selectedRole, name) => {
    const mockUser: UserProfile = {
      id: Math.random().toString(36).substring(2, 11),
      phone,
      role: selectedRole,
      name: name || (selectedRole === 'vendor' ? 'Premium Vendor' : 'Valued Customer'),
    };
    
    set({ user: mockUser, role: selectedRole });
    
    if (selectedRole === 'customer') {
      useUIStore.getState().setPoints(0);
    }

    if (selectedRole === 'vendor') {
      useVendorStore.getState().ensureVendorProfile(mockUser);
    }
  },

  logout: () => {
    set({ user: null, role: null });
    useUIStore.getState().setPoints(0);
    useVendorStore.getState().resetSavedVendors();
    useTripStore.getState().resetTrips();
    useLocationStore.getState().resetLocality();
  }
}));
