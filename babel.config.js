module.exports = function (api) {
  const isProd = api.env('production');

  const plugins = [
    ['inline-import', { extensions: ['.sql'] }],
    ...(isProd ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : []),
    'react-native-reanimated/plugin',
  ];

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
