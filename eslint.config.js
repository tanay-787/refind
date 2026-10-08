const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

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
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
