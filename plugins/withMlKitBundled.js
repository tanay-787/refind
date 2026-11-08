let configPlugins;
try {
  configPlugins = require('expo/config-plugins');
} catch {
  configPlugins = require('@expo/config-plugins');
}

const {
  withProjectBuildGradle,
  withGradleProperties,
  withAndroidManifest,
} = configPlugins;

function withMlKitBundled(config) {
  // 1. Ensure rootProject.ext has ocrUseBundled = true and ocrModels at the top level
  config = withProjectBuildGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;

    // Clean up any erroneous buildscript { ext { ... } } blocks that rn-mlkit-ocr's plugin may generate
    contents = contents.replace(
      /buildscript\s*\{\s*ext\s*\{[\s\S]*?ocrModels[\s\S]*?ocrUseBundled[\s\S]*?\}\s*\}/g,
      ''
    );

    const configBlock = `
// --- RN-MLKIT-OCR ROOT EXT CONFIG START ---
ext {
    ocrModels = ["latin", "devanagari"]
    ocrUseBundled = true
}
// --- RN-MLKIT-OCR ROOT EXT CONFIG END ---
`;

    if (!contents.includes('ocrUseBundled = true')) {
      contents = contents + '\n' + configBlock;
    } else {
      // Ensure it is not wrapped inside buildscript
      contents = contents.replace(/buildscript\s*\{\s*ext\s*\{([\s\S]*?)\}\s*\}/g, (match, inner) => {
        if (inner.includes('ocrUseBundled')) {
          return '';
        }
        return match;
      });
      if (!contents.includes('ocrUseBundled = true')) {
        contents = contents + '\n' + configBlock;
      }
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });

  // 2. Ensure gradle.properties contains the RnMlkitOcr properties on EAS/CI builds
  config = withGradleProperties(config, (gradlePropsConfig) => {
    const props = gradlePropsConfig.modResults;

    function setProperty(key, value) {
      const item = props.find((p) => p.type === 'property' && p.key === key);
      if (item) {
        item.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    }

    setProperty('RnMlkitOcr_ocrUseBundled', 'true');
    setProperty('RnMlkitOcr_ocrModels', '["latin", "devanagari"]');

    return gradlePropsConfig;
  });

  // 3. Add Google ML Kit vision dependencies metadata to AndroidManifest.xml
  config = withAndroidManifest(config, (manifestConfig) => {
    const mainApplication = manifestConfig.modResults.manifest.application?.[0];
    if (mainApplication) {
      if (!mainApplication['meta-data']) {
        mainApplication['meta-data'] = [];
      }
      const existing = mainApplication['meta-data'].find(
        (m) => m.$?.['android:name'] === 'com.google.mlkit.vision.DEPENDENCIES'
      );
      if (!existing) {
        mainApplication['meta-data'].push({
          $: {
            'android:name': 'com.google.mlkit.vision.DEPENDENCIES',
            'android:value': 'ocr',
          },
        });
      }
    }
    return manifestConfig;
  });

  return config;
}

module.exports = withMlKitBundled;
