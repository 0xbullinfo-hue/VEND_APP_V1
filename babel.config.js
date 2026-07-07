module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for react-native-reanimated's `export * as default` syntax
      '@babel/plugin-transform-export-namespace-from',
      // Reanimated plugin MUST be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
