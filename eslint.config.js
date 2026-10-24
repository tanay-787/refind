const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  globalIgnores(['.expo/**', 'dist/**', 'web-build/**', 'node_modules/**']),
  expoConfig,
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'react-hooks/immutability': 'off',
    },
  },
]);
