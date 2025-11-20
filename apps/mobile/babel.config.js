module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.ts', '.tsx', '.js', '.json'],
          alias: {
            '@/app': './app',
            '@/features': './src/features',
            '@/ui': './src/ui',
            '@/lib': './src/lib',
          },
        },
      ],
      // ⚠️ BẮT BUỘC: luôn để plugin này CUỐI CÙNG
      'react-native-reanimated/plugin',
    ],
  };
};
