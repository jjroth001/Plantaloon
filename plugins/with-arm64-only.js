/**
 * Packages native libraries for 64-bit ARM phones only (every Android phone from the last
 * several years). Without this, ONNX Runtime ships copies for four chip types and adds ~35 MB.
 * Builds use -PreactNativeArchitectures=arm64-v8a, so React Native already matches.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withArm64Only(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes("abiFilters 'arm64-v8a'")) return cfg;
    gradle = gradle.replace(
      /defaultConfig \{/,
      "defaultConfig {\n        ndk { abiFilters 'arm64-v8a' }",
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
