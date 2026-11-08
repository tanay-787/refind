const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const wrapperPath = path.join(rootDir, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
const gradlePropsPath = path.join(rootDir, 'android', 'gradle.properties');
const buildGradlePath = path.join(rootDir, 'android', 'build.gradle');

const gradleDistributionUrl = 'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.0.0-bin.zip';

function updateFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }

  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  for (const { pattern, value } of replacements) {
    if (pattern.test(updated)) {
      updated = updated.replace(pattern, value);
    } else {
      updated = `${updated.replace(/\s*$/, '')}\n${value}\n`;
    }
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
    return true;
  }

  return false;
}

const wrapperChanged = updateFile(wrapperPath, [
  {
    pattern: /^distributionUrl=.*$/m,
    value: gradleDistributionUrl,
  },
]);

const javaHomeReplacements = process.env.JAVA_HOME
  ? [
      {
        pattern: /^org\.gradle\.java\.home=.*$/m,
        value: `org.gradle.java.home=${process.env.JAVA_HOME}`,
      },
    ]
  : [];

const gradlePropsChanged = updateFile(gradlePropsPath, [
  ...javaHomeReplacements,
  {
    pattern: /^reactNativeArchitectures=.*$/m,
    value: 'reactNativeArchitectures=arm64-v8a',
  },
  {
    pattern: /^org\.gradle\.jvmargs=.*$/m,
    value: 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m',
  },
  {
    pattern: /^org\.gradle\.workers\.max=.*$/m,
    value: 'org.gradle.workers.max=2',
  },
  {
    pattern: /^RnMlkitOcr_ocrUseBundled=.*$/m,
    value: 'RnMlkitOcr_ocrUseBundled=true',
  },
  {
    pattern: /^RnMlkitOcr_ocrModels=.*$/m,
    value: 'RnMlkitOcr_ocrModels=["latin", "devanagari"]',
  },
]);

let buildGradleChanged = false;
if (fs.existsSync(buildGradlePath)) {
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  const original = buildGradle;

  // Remove buildscript { ext { ocrModels... } } if present
  buildGradle = buildGradle.replace(
    /buildscript\s*\{\s*ext\s*\{[\s\S]*?ocrModels[\s\S]*?ocrUseBundled[\s\S]*?\}\s*\}/g,
    ''
  );

  const topExt = `ext {
    // --- RN-MLKIT-OCR ROOT EXT CONFIG START ---
    ocrModels = ["latin", "devanagari"]
    ocrUseBundled = true
    // --- RN-MLKIT-OCR ROOT EXT CONFIG END ---
}`;

  if (!buildGradle.includes('ocrUseBundled = true')) {
    buildGradle = buildGradle.trimEnd() + '\n\n' + topExt + '\n';
  }

  if (buildGradle !== original) {
    fs.writeFileSync(buildGradlePath, buildGradle);
    buildGradleChanged = true;
  }
}

console.log(
  [
    wrapperChanged ? `updated ${path.relative(rootDir, wrapperPath)}` : `already set ${path.relative(rootDir, wrapperPath)}`,
    gradlePropsChanged ? `updated ${path.relative(rootDir, gradlePropsPath)}` : `already set ${path.relative(rootDir, gradlePropsPath)}`,
    buildGradleChanged ? `updated ${path.relative(rootDir, buildGradlePath)}` : `already set ${path.relative(rootDir, buildGradlePath)}`,
  ].join('\n'),
);
