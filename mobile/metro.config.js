const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude the nested react-native@0.86.0 that npm installs as a peer dep
// of @react-native/dev-middleware@0.86.0 — it contains codegen files
// incompatible with the @react-native/codegen version shipped with RN 0.81.5.
const nestedRN = path.join(__dirname, 'node_modules', 'react-native', 'node_modules', 'react-native');
config.resolver = config.resolver || {};
config.resolver.blockList = [
  ...(config.resolver.blockList ? [config.resolver.blockList].flat() : []),
  new RegExp(`^${nestedRN.replace(/\\/g, '\\\\').replace(/\./g, '\\.')}.*`),
];

module.exports = config;
