const {
  withNativeWind: withNativeWind
} = require("nativewind/metro");

// metro.config.js
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Added this line:
config.resolver.assetExts.push("png");

module.exports = withNativeWind(config, {
  input: "./global.css"
});

module.exports = wrapWithReanimatedMetroConfig(config);