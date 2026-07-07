// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro in SDK 46 doesn't recognise .cjs/.mjs by default.
// @supabase/storage-js → iceberg-js ships only .cjs/.mjs dist files.
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

module.exports = config;
