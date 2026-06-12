const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'vendor', 'react-native-siglip', 'dist', 'android');
const sourceBuildDir = path.join(rootDir, 'vendor', 'react-native-siglip', '.executorch-build', 'executorch');
const packageDir = path.join(rootDir, 'node_modules', 'react-native-siglip');
const targetDir = path.join(packageDir, 'dist', 'android');
const targetBuildDir = path.join(packageDir, '.executorch-build', 'executorch');

if (!fs.existsSync(sourceDir)) {
  throw new Error(
    `Missing SigLIP binaries at ${sourceDir}. Expected vendor/react-native-siglip/dist/android to be checked in.`,
  );
}

if (!fs.existsSync(sourceBuildDir)) {
  throw new Error(
    `Missing ExecuTorch build tree at ${sourceBuildDir}. Expected vendor/react-native-siglip/.executorch-build/executorch to be checked in.`,
  );
}

if (!fs.existsSync(packageDir)) {
  throw new Error(
    'react-native-siglip is not installed yet. Run package installation before copying binaries.',
  );
}

console.log('Requirements met, Initiating ...')

console.log('Executing 1st')
fs.rmSync(targetDir, { recursive: true, force: true });
console.log('Done')

console.log('Executing 2nd')
fs.rmSync(targetBuildDir, { recursive: true, force: true });
console.log('Done')

console.log('Executing 3rd')
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
console.log('Done')

console.log('Executing 4th')
fs.mkdirSync(path.dirname(targetBuildDir), { recursive: true });
console.log('Done')

console.log('Executing 5th')
fs.cpSync(sourceDir, targetDir, { recursive: true });
console.log('Done')

console.log('Executing 6th')
fs.cpSync(sourceBuildDir, targetBuildDir, { recursive: true });


console.log('Finished Execution successfully');
