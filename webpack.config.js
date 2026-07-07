// ── Node v17+ / webpack 4 compatibility fix ──────────────────────────────────
const crypto = require('crypto');
const origCreateHash = crypto.createHash;
crypto.createHash = (algorithm, options) =>
  origCreateHash(algorithm === 'md4' ? 'sha256' : algorithm, options);
// ──────────────────────────────────────────────────────────────────────────────

const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.plugins = config.plugins || [];

  // ── Fix 1: Inject process polyfill BEFORE any module code ─────────────────
  // BannerPlugin with raw:true injects raw JS at the very top of every output
  // file (including chunks), before webpack's runtime or any module executes.
  config.plugins.push(
    new webpack.BannerPlugin({
      banner: ';(function(){var g=typeof window!=="undefined"?window:typeof globalThis!=="undefined"?globalThis:typeof self!=="undefined"?self:typeof global!=="undefined"?global:{};if(typeof g.process==="undefined"){g.process={env:{},browser:true};}else if(!g.process.env){g.process.env={};}})();',
      raw: true,
      entryOnly: false, // Apply to all chunks, not just entry
      test: /\.js$/,
    })
  );

  // ── Fix 2: Resolve .cjs and .mjs extensions ──────────────────────────────
  config.resolve = config.resolve || {};
  config.resolve.extensions = config.resolve.extensions || [];
  if (!config.resolve.extensions.includes('.cjs')) {
    config.resolve.extensions.push('.cjs');
  }
  if (!config.resolve.extensions.includes('.mjs')) {
    config.resolve.extensions.push('.mjs');
  }

  // ── Fix 3: Prefer CJS over ESM ───────────────────────────────────────────
  config.resolve.mainFields = ['browser', 'main'];

  // ── Fix 4: Alias supabase packages to .cjs.js copies ─────────────────────
  // Webpack 4 can't reliably resolve .cjs files. We use .js copies of the
  // CJS bundles so webpack finds and processes them normally.
  config.resolve.alias = config.resolve.alias || {};
  config.resolve.alias['@supabase/supabase-js'] = path.resolve(
    __dirname, 'node_modules/@supabase/supabase-js/dist/index.cjs.js'
  );
  config.resolve.alias['@supabase/postgrest-js'] = path.resolve(
    __dirname, 'node_modules/@supabase/postgrest-js/dist/index.cjs.js'
  );
  config.resolve.alias['@supabase/storage-js'] = path.resolve(
    __dirname, 'node_modules/@supabase/storage-js/dist/index.cjs.js'
  );
  config.resolve.alias['nanoid/non-secure'] = path.resolve(
    __dirname, 'src/lib/nanoid-compat.js'
  );
  config.resolve.alias['react-native-maps'] = path.resolve(
    __dirname, 'src/components/MapViewCompat.web.tsx'
  );

  // ── Fix 5: Handle .mjs and .cjs files as JavaScript ──────────────────────
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.unshift(
    { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
    { test: /\.cjs(\.js)?$/, include: /node_modules/, type: 'javascript/auto' }
  );

  // ── Fix 6: Transpile modern syntax in node_modules ────────────────────────
  const babelRule = findBabelRule(config.module.rules);
  if (babelRule) {
    const originalInclude = babelRule.include;
    const packagesToTranspile = [
      '@supabase',
      'phoenix',
      '@gorhom/bottom-sheet',
      'react-native-reanimated',
    ];
    babelRule.include = (filePath) => {
      if (matchesInclude(originalInclude, filePath)) return true;
      return packagesToTranspile.some((pkg) => {
        const normalizedPkg = pkg.replace(/\//g, '\\');
        return filePath.includes('node_modules/' + pkg) || filePath.includes('node_modules\\' + normalizedPkg);
      });
    };
  }

  return config;
};

function matchesInclude(include, filePath) {
  if (!include) return false;
  if (typeof include === 'function') return include(filePath);
  if (typeof include === 'string') return filePath.startsWith(include);
  if (include instanceof RegExp) return include.test(filePath);
  if (Array.isArray(include)) return include.some((i) => matchesInclude(i, filePath));
  return false;
}

function findBabelRule(rules) {
  if (!rules) return null;
  for (const rule of rules) {
    if (rule.use) {
      const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
      for (const use of uses) {
        const loader = typeof use === 'string' ? use : use?.loader;
        if (loader && loader.includes('babel-loader')) return rule;
      }
    }
    if (rule.oneOf) {
      const found = findBabelRule(rule.oneOf);
      if (found) return found;
    }
    if (rule.rules) {
      const found = findBabelRule(rule.rules);
      if (found) return found;
    }
  }
  return null;
}
