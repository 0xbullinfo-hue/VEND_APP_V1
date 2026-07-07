/**
 * Web polyfills — loaded before any app code.
 * Ensures `process` and `process.env` are available globally for
 * libraries that reference them (e.g. @supabase/supabase-js).
 */
if (typeof process === 'undefined') {
  window.process = { env: {}, browser: true };
}
if (!process.env) {
  process.env = {};
}
