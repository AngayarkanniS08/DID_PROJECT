const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const appNodeModules = path.resolve(projectRoot, 'node_modules');

// Get default Expo config - handles monorepo automatically since SDK 52
const config = getDefaultConfig(projectRoot);

const { assetExts, sourceExts } = config.resolver;

// SVG transformer support
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};
config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'cjs', 'mjs', 'svg'];

// Map local package to its built location.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@secure-verify/did-core': path.resolve(
    __dirname,
    '../../packages/did-core'
  ),
  'ethers': path.join(appNodeModules, 'ethers'),
  'otpauth': path.join(appNodeModules, 'otpauth'),
};

// Watch the packages folder for local packages
config.watchFolders = [path.resolve(__dirname, '../../packages')];

config.cacheVersion = 'mobile-wallet-v1';

module.exports = config;
