import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { useUIStore } from './useUIStore';
import { useVendorStore } from './useVendorStore';
import { useTripStore } from './useTripStore';
import { useLocationStore } from './useLocationStore';
import { useAnalyticsStore } from './useAnalyticsStore';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  ensureProfileExists,
  getSession,
  signOut,
  onAuthStateChange,
} from '../lib/supabaseAuth';
import { sanitizeName } from '../lib/inputSanitization';

interface AuthState {
  user: UserProfile | null;
  role: 'customer' | 'vendor' | null;
  onboardingCompleted: boolean;
  isHydrated: boolean;

  // New: OTP flow state
  otpSending: boolean;
  otpError: string | null;

  // Auth actions
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string, role: 'customer' | 'vendor', name: string) => Promise<{ success: boolean; error?: string }>;
  login: (phone: string, role: 'customer' | 'vendor', name: string) => Promise<void>;
  setOnboardingLocality: (localityId: number) => Promise<void>;
  setReferralCode: (code: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  hydrateAuthSession: () => Promise<void>;
  initAuthListener: () => () => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      onboardingCompleted: false,
      isHydrated: false,
      otpSending: false,
      otpError: null,

      setHydrated: (val) => set({ isHydrated: val }),

      /**
       * Step 1: Send OTP to phone number.
       */
      sendOtp: async (phone) => {
        set({ otpSending: true, otpError: null });
        const result = await sendPhoneOtp(phone);
        set({ otpSending: false, otpError: result.error || null });
        return { success: result.success, error: result.error };
      },

      /**
       * Step 2: Verify OTP and establish session.
       */
      verifyOtp: async (phone, token, selectedRole, name) => {
        set({ otpSending: true, otpError: null });

        const sanitizedName = sanitizeName(name);
        const verifyResult = await verifyPhoneOtp(phone, token);

        if (!verifyResult.success) {
          set({ otpSending: false, otpError: verifyResult.error || 'Verification failed.' });
          return { success: false, error: verifyResult.error };
        }

        const userId = verifyResult.userId!;

        // Ensure profile exists in Supabase (idempotent)
        if (isSupabaseConfigured()) {
          const profileResult = await ensureProfileExists(userId, phone, selectedRole, sanitizedName);
          if (!profileResult.success) {
            if (__DEV__) {
              console.warn('[AuthStore] Profile creation failed:', profileResult.error);
            }
          }
        }

        const userProfile: UserProfile = {
          id: userId,
          phone,
          role: selectedRole,
          name: sanitizedName || (selectedRole === 'vendor' ? 'Premium Vendor' : 'Valued Customer'),
        };

        set({
          user: userProfile,
          role: selectedRole,
          onboardingCompleted: false,
          otpSending: false,
          otpError: null,
        });

        if (selectedRole === 'customer') {
          useUIStore.getState().setPoints(0);
        }

        if (selectedRole === 'vendor') {
          useVendorStore.getState().ensureVendorProfile(userProfile);
        }

        return { success: true };
      },

      /**
       * Legacy login method.
       */
      login: async (phone, selectedRole, name) => {
        const sanitizedName = sanitizeName(name);
        const mockUser: UserProfile = {
          id: Math.random().toString(36).substring(2, 11),
          phone,
          role: selectedRole,
          name: sanitizedName || (selectedRole === 'vendor' ? 'Premium Vendor' : 'Valued Customer'),
        };

        set({
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
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, localityId } });
      },

      setReferralCode: async (code) => {
        const { user } = get();
        if (!user) return;
        const normalizedCode = code.trim();
        set({ user: { ...user, referralCode: normalizedCode || undefined } });
      },

      completeOnboarding: async () => {
        set({ onboardingCompleted: true });
      },

      /**
       * Hydrate auth session on app startup.
       */
      hydrateAuthSession: async () => {
        try {
          if (isSupabaseConfigured()) {
            const session = await getSession();
            if (session) {
              const current = get();
              if (current.user?.id === session.userId) {
                set({ isHydrated: true });
                return;
              }
              set({
                user: {
                  id: session.userId,
                  phone: session.phone || '',
                  role: 'customer',
                  name: '',
                },
                role: null,
                onboardingCompleted: false,
                isHydrated: true,
              });
              return;
            }
          }
          set({ isHydrated: true });
        } catch {
          set({ isHydrated: true });
        }
      },

      initAuthListener: () => {
        return onAuthStateChange((event, userId) => {
          if (event === 'SIGNED_OUT') {
            const { user } = get();
            if (user) {
              set({ user: null, role: null, onboardingCompleted: false });
              useUIStore.getState().setPoints(0);
              useVendorStore.getState().resetSavedVendors();
              useTripStore.getState().resetTrips();
              useLocationStore.getState().resetLocality();
              useAnalyticsStore.getState().resetAnalytics();
            }
          }
        });
      },

      logout: () => {
        void signOut();
        set({ user: null, role: null, onboardingCompleted: false, isHydrated: true, otpError: null });
        useUIStore.getState().setPoints(0);
        useVendorStore.getState().resetSavedVendors();
        useTripStore.getState().resetTrips();
        useLocationStore.getState().resetLocality();
        useAnalyticsStore.getState().resetAnalytics();
      }
    }),
    {
      name: 'vend.auth.v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);


