module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        // Rewrites React Native Paper imports so only used modules are bundled.
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
