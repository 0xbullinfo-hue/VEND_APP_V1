import { create } from 'zustand';
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
}

const persistAuth = async (payload: AuthPersistPayload) => {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  onboardingCompleted: false,
  isHydrated: false,
  otpSending: false,
  otpError: null,

  /**
   * Step 1: Send OTP to phone number.
   * Uses real Supabase when configured, mock otherwise.
   */
  sendOtp: async (phone) => {
    set({ otpSending: true, otpError: null });

    const result = await sendPhoneOtp(phone);

    set({ otpSending: false, otpError: result.error || null });
    return { success: result.success, error: result.error };
  },

  /**
   * Step 2: Verify OTP and establish session.
   * Uses real Supabase when configured, mock otherwise.
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
        // Profile creation failed but auth succeeded — continue with warning
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

    await persistAuth({
      user: userProfile,
      role: selectedRole,
      onboardingCompleted: false,
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
   * Legacy login method — kept for backward compatibility.
   * In mock mode, creates a local-only user.
   * In Supabase mode, this should not be called directly;
   * use sendOtp() + verifyOtp() instead.
   */
  login: async (phone, selectedRole, name) => {
    if (isSupabaseConfigured()) {
      console.warn('[AuthStore] login() called with Supabase configured. Use sendOtp() + verifyOtp() instead.');
    }

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

  /**
   * Hydrate auth session on app startup.
   * Checks Supabase session first (if configured), then falls back to AsyncStorage.
   */
  hydrateAuthSession: async () => {
    try {
      // 1. Try to restore from Supabase session (real auth)
      if (isSupabaseConfigured()) {
        const session = await getSession();
        if (session) {
          // We have a valid Supabase session — load local profile data
          const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as AuthPersistPayload;
            // Verify the stored profile matches the Supabase session user
            if (parsed.user?.id === session.userId) {
              set({
                user: parsed.user,
                role: parsed.role,
                onboardingCompleted: !!parsed.onboardingCompleted,
                isHydrated: true,
              });
              return;
            }
          }

          // Session exists but no matching local profile — user needs to re-onboard
          set({
            user: {
              id: session.userId,
              phone: session.phone || '',
              role: 'customer', // Default, will be updated during onboarding
              name: '',
            },
            role: null,
            onboardingCompleted: false,
            isHydrated: true,
          });
          return;
        }
      }

      // 2. Fallback: restore from AsyncStorage (mock mode or offline)
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

  /**
   * Initialize auth state change listener.
   * Handles token refresh, session expiry, and sign-out events.
   * Returns cleanup function.
   */
  initAuthListener: () => {
    return onAuthStateChange((event, userId) => {
      if (event === 'SIGNED_OUT') {
        // User was signed out (possibly from another device or token expired)
        const { user } = get();
        if (user) {
          if (__DEV__) {
            console.log('[AuthStore] Session ended externally, clearing local state');
          }
          set({ user: null, role: null, onboardingCompleted: false });
          void AsyncStorage.removeItem(AUTH_STORAGE_KEY);
          useUIStore.getState().setPoints(0);
          useVendorStore.getState().resetSavedVendors();
          useTripStore.getState().resetTrips();
          useLocationStore.getState().resetLocality();
          useAnalyticsStore.getState().resetAnalytics();
        }
      } else if (event === 'TOKEN_REFRESHED') {
        if (__DEV__) {
          console.log('[AuthStore] Token refreshed for user:', userId);
        }
      }
    });
  },

  logout: () => {
    // Sign out from Supabase (async, fire-and-forget)
    void signOut();

    // Clear local state immediately
    set({ user: null, role: null, onboardingCompleted: false, isHydrated: true, otpError: null });
    void AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    useUIStore.getState().setPoints(0);
    useVendorStore.getState().resetSavedVendors();
    useTripStore.getState().resetTrips();
    useLocationStore.getState().resetLocality();
    useAnalyticsStore.getState().resetAnalytics();
  }
}));


