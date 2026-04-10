const { withProjectBuildGradle, withGradleProperties } = require('@expo/config-plugins');

// Patches android/build.gradle AND android/gradle.properties to force Kotlin 1.9.25
// Fixes: Compose Compiler 1.5.15 requires Kotlin 1.9.25 but EAS defaults to 1.9.24
const withKotlinVersion = (config, { version = '1.9.25' } = {}) => {
  // Patch 1: Replace kotlinVersion in root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    // Replace any kotlinVersion = "x.x.x" or kotlinVersion = 'x.x.x'
    config.modResults.contents = contents.replace(
      /kotlinVersion\s*=\s*["'][\d.]+["']/g,
      `kotlinVersion = "${version}"`
    );
    return config;
  });

  // Patch 2: Set kotlin.version in gradle.properties as a fallback
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (prop) => !(prop.type === 'property' && prop.key === 'kotlin.version')
    );
    config.modResults.push({
      type: 'property',
      key: 'kotlin.version',
      value: version,
    });
    return config;
  });

  return config;
};

module.exports = withKotlinVersion;
