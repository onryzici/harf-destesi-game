// Metro yapılandırması.
// Paylaşılan saf mantık mobile/shared'a aynalandığından (scripts/sync-shared.mjs)
// her şey proje kökü İÇİNDE — cross-root resolver hack'i gerekmez.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bu makinedeki watchman bozuk (libicu uyumsuzluğu) → node dosya-tarayıcısını kullan.
// (Repo-içi, makineden bağımsız; watchman düzelse de zararsız.)
config.resolver.useWatchman = false;

// 653KB Türkçe sözlüğü asset olarak ele al (JS bundle'a gömme) → expo-asset ile okunur.
config.resolver.assetExts.push("txt");

module.exports = config;
