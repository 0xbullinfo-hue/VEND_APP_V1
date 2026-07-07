/**
 * Supabase Auth Helpers
 *
 * Centralized authentication module for real Supabase Phone OTP auth.
 * Falls back gracefully when Supabase is not configured (dev/mock mode).
 *
 * Usage:
 *   import { sendPhoneOtp, verifyPhoneOtp, ensureProfileExists } from './supabaseAuth';
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { sanitizePhoneNumber } from './inputSanitization';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  userId?: string;
  error?: string;
  errorCode?: string;
}

export interface SessionInfo {
  userId: string;
  phone?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ─── Phone OTP ────────────────────────────────────────────────────────────────

/**
 * Send a phone OTP via Supabase Auth.
 * Returns { success: true } if the OTP was dispatched.
 *
 * When Supabase is not configured, returns success to allow mock mode.
 */
export async function sendPhoneOtp(phone: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    // Mock mode — simulate a successful OTP dispatch
    if (__DEV__) {
      console.log('[SupabaseAuth] Mock mode: OTP dispatch simulated for', phone);
    }
    return { success: true };
  }

  try {
    const sanitized = sanitizePhoneNumber(phone);
    if (!sanitized) {
      return { success: false, error: 'Invalid phone number format.', errorCode: 'INVALID_PHONE' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: sanitized,
    });

    if (error) {
      // Map common Supabase errors to user-friendly messages
      if (error.message.includes('rate limit') || error.status === 429) {
        return {
          success: false,
          error: 'Too many attempts. Please wait a minute and try again.',
          errorCode: 'RATE_LIMIT',
        };
      }
      return {
        success: false,
        error: error.message || 'Failed to send verification code.',
        errorCode: error.status?.toString() || 'OTP_SEND_FAILED',
      };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
    return { success: false, error: message, errorCode: 'NETWORK_ERROR' };
  }
}

/**
 * Verify a phone OTP code.
 * Returns the authenticated user ID on success.
 *
 * When Supabase is not configured, accepts any code (mock mode).
 */
export async function verifyPhoneOtp(
  phone: string,
  token: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    // Mock mode — accept any code
    if (__DEV__) {
      console.log('[SupabaseAuth] Mock mode: OTP verification simulated');
    }
    return { success: true, userId: `mock_${Date.now().toString(36)}` };
  }

  try {
    const sanitized = sanitizePhoneNumber(phone);
    if (!sanitized) {
      return { success: false, error: 'Invalid phone number format.', errorCode: 'INVALID_PHONE' };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: sanitized,
      token,
      type: 'sms',
    });

    if (error) {
      if (error.message.includes('invalid') || error.message.includes('expired')) {
        return {
          success: false,
          error: 'Invalid or expired verification code. Please try again.',
          errorCode: 'INVALID_OTP',
        };
      }
      return {
        success: false,
        error: error.message || 'Verification failed.',
        errorCode: error.status?.toString() || 'VERIFY_FAILED',
      };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { success: false, error: 'Verification succeeded but no user was returned.', errorCode: 'NO_USER' };
    }

    return { success: true, userId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error. Please check your connection.';
    return { success: false, error: message, errorCode: 'NETWORK_ERROR' };
  }
}

// ─── Profile Management ───────────────────────────────────────────────────────

/**
 * Ensure the authenticated user has a profile row in `profiles` and the
 * role-specific table (`customers` or `vendors`).
 *
 * This is called after successful OTP verification.
 * Uses upsert to be idempotent (safe to call multiple times).
 */
export async function ensureProfileExists(
  userId: string,
  phone: string,
  role: 'customer' | 'vendor',
  name: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { success: true, userId };
  }

  try {
    // 1. Upsert into profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: `${phone.replace(/\+/g, '')}@phone.vend.app`, // placeholder email for phone-only users
          phone,
          role,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('[SupabaseAuth] Profile upsert failed:', profileError.message);
      return { success: false, error: 'Failed to create profile.', errorCode: 'PROFILE_CREATE_FAILED' };
    }

    // 2. Upsert into role-specific table
    if (role === 'customer') {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: customerError } = await supabase
        .from('customers')
        .upsert(
          { id: userId, first_name: firstName, last_name: lastName },
          { onConflict: 'id' }
        );

      if (customerError) {
        console.error('[SupabaseAuth] Customer profile upsert failed:', customerError.message);
        // Non-fatal: profile was created, customer sub-profile can be retried
      }
    } else {
      const { error: vendorError } = await supabase
        .from('vendors')
        .upsert(
          {
            id: userId,
            business_name: name || 'My Business',
            category: 'Professional Services',
          },
          { onConflict: 'id' }
        );

      if (vendorError) {
        console.error('[SupabaseAuth] Vendor profile upsert failed:', vendorError.message);
        // Non-fatal: profile was created, vendor sub-profile can be retried
      }
    }

    return { success: true, userId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to set up profile.';
    return { success: false, error: message, errorCode: 'PROFILE_SETUP_ERROR' };
  }
}

// ─── Session Helpers ──────────────────────────────────────────────────────────

/**
 * Get the current authenticated session, if any.
 */
export async function getSession(): Promise<SessionInfo | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }

    return {
      userId: session.user.id,
      phone: session.user.phone,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Force refresh the current session token.
 */
export async function refreshSession(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase.auth.refreshSession();
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get the authenticated user's ID, or null if not signed in.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Sign out the current user from Supabase.
 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[SupabaseAuth] Sign out error:', err);
  }
}

/**
 * Subscribe to auth state changes (login, logout, token refresh).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(
  callback: (event: string, userId: string | null) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      const userId = session?.user?.id ?? null;

      if (__DEV__) {
        console.log(`[SupabaseAuth] Auth state changed: ${event}`, { userId });
      }

      callback(event, userId);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}
