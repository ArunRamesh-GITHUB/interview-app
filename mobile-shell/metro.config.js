const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'ts', 'tsx'];

// Use compiled lib files for react-native-iap to avoid src/types.ts resolution issues
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
