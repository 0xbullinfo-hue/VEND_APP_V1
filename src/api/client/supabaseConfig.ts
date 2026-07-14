export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
export const appVersion = process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
export const appEnv = process.env.EXPO_PUBLIC_APP_ENV || (__DEV__ ? 'development' : 'production');
