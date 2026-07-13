import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { fetchWithPinning } from './sslPinning';

// ─── Environment Validation ───────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const appVersion = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
const appEnv = process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? 'development' : 'production');

const hasRealSupabaseConfig =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.startsWith('https://');

// Fail loudly in production if Supabase is not configured
if (!__DEV__ && !hasRealSupabaseConfig) {
  console.error(
    '[Supabase] CRITICAL: Supabase is not configured. ' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Warn if URL is not HTTPS (should never happen in production)
if (hasRealSupabaseConfig && !supabaseUrl.startsWith('https://')) {
  console.error('[Supabase] SECURITY: Supabase URL must use HTTPS.');
}

// ─── Custom Fetch Wrapper ─────────────────────────────────────────────────────

/**
 * Custom fetch that attaches security headers for API audit trail.
 */
const secureFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set('X-App-Version', appVersion);
  headers.set('X-App-Platform', Platform.OS);
  headers.set('X-App-Env', appEnv);

  // Professional: Attach SSL Pinning and Certificate Validation to every Supabase call
  return fetchWithPinning(input as string, { ...init, headers });
};

// ─── Supabase Client ──────────────────────────────────────────────────────────

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Enhanced security for auth flows
  },
  global: {
    fetch: secureFetch,
    headers: {
      'X-App-Version': appVersion,
    },
  },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const isSupabaseConfigured = () => hasRealSupabaseConfig;

/**
 * Extract the Supabase project domain for SSL pinning configuration.
 * Returns the hostname portion of the Supabase URL.
 */
export const getSupabaseDomain = (): string | null => {
  if (!hasRealSupabaseConfig) return null;
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }
};
