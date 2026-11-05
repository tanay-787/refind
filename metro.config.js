const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
});
