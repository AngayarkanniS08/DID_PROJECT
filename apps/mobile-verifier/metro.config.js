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

// Map local package to its built location. Built did-core lives under dist/ and
// uses require("ethers") etc.; Metro must resolve those from this app, not from
// dist/packages/did-core/.../node_modules (which does not exist).
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@secure-verify/did-core': path.resolve(
    __dirname,
    '../../dist/packages/did-core',
  ),
  ethers: path.join(appNodeModules, 'ethers'),
  merkletreejs: path.join(appNodeModules, 'merkletreejs'),
  keccak256: path.join(appNodeModules, 'keccak256'),
};

// Watch the dist folder for local packages
config.watchFolders = [path.resolve(__dirname, '../../dist')];

config.cacheVersion = 'mobile-verifier-v2';

module.exports = config;
