import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { useUIStore } from './useUIStore';
import { useVendorStore } from './useVendorStore';
import { useTripStore } from './useTripStore';
import { useLocationStore } from './useLocationStore';

const AUTH_STORAGE_KEY = 'vend.auth.v1';

interface AuthPersistPayload {
  user: UserProfile | null;
  role: 'customer' | 'vendor' | null;
  onboardingCompleted: boolean;
}

interface AuthState {
  user: UserProfile | null;
  role: 'customer' | 'vendor' | null;
  onboardingCompleted: boolean;
  isHydrated: boolean;
  login: (phone: string, role: 'customer' | 'vendor', name: string) => Promise<void>;
  setOnboardingLocality: (localityId: number) => Promise<void>;
  setReferralCode: (code: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  hydrateAuthSession: () => Promise<void>;
  logout: () => void;
}

const persistAuth = async (payload: AuthPersistPayload) => {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  onboardingCompleted: false,
  isHydrated: false,

  login: async (phone, selectedRole, name) => {
    const mockUser: UserProfile = {
      id: Math.random().toString(36).substring(2, 11),
      phone,
      role: selectedRole,
      name: name || (selectedRole === 'vendor' ? 'Premium Vendor' : 'Valued Customer'),
    };

    set({
      user: mockUser,
      role: selectedRole,
      onboardingCompleted: false,
    });

    await persistAuth({
      user: mockUser,
      role: selectedRole,
      onboardingCompleted: false,
    });
    
    if (selectedRole === 'customer') {
      useUIStore.getState().setPoints(0);
    }

    if (selectedRole === 'vendor') {
      useVendorStore.getState().ensureVendorProfile(mockUser);
    }
  },

  setOnboardingLocality: async (localityId) => {
    const { user, role, onboardingCompleted } = get();
    if (!user || !role) {
      return;
    }

    const updatedUser: UserProfile = {
      ...user,
      localityId,
    };

    set({ user: updatedUser });
    await persistAuth({
      user: updatedUser,
      role,
      onboardingCompleted,
    });
  },

  setReferralCode: async (code) => {
    const { user, role, onboardingCompleted } = get();
    if (!user || !role) {
      return;
    }

    const normalizedCode = code.trim();
    const updatedUser: UserProfile = {
      ...user,
      referralCode: normalizedCode || undefined,
    };

    set({ user: updatedUser });
    await persistAuth({
      user: updatedUser,
      role,
      onboardingCompleted,
    });
  },

  completeOnboarding: async () => {
    const { user, role } = get();
    if (!user || !role) {
      return;
    }

    set({ onboardingCompleted: true });
    await persistAuth({
      user,
      role,
      onboardingCompleted: true,
    });
  },

  hydrateAuthSession: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

      if (!raw) {
        set({ isHydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as AuthPersistPayload;

      set({
        user: parsed.user,
        role: parsed.role,
        onboardingCompleted: !!parsed.onboardingCompleted,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  logout: () => {
    set({ user: null, role: null, onboardingCompleted: false, isHydrated: true });
    void AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    useUIStore.getState().setPoints(0);
    useVendorStore.getState().resetSavedVendors();
    useTripStore.getState().resetTrips();
    useLocationStore.getState().resetLocality();
  }
}));
