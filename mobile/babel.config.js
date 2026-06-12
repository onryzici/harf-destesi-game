// Babel — Expo preset. (Modül alias'ları Metro tarafında çözülüyor: metro.config.js
// extraNodeModules → @engine/@data paylaşılan saf mantığa işaret eder. CLAUDE.md 7.2.)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // NOT: react-native-reanimated/plugin Faz C'de EN SONA eklenecek.
  };
};
