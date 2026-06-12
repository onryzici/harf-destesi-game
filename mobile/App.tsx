// Kök bileşen — fontları yükle, yatay kilitle, sözlüğü arka planda yükle, sonra
// menü/oyun ekranını göster. (Web main.js boot() + index.html kabuğu muadili.)

import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as ScreenOrientation from "expo-screen-orientation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useGameStore } from "./src/store";
import { loadDictionaryAsset } from "./src/dictionaryLoader";
import { MenuOverlay } from "./src/components/MenuOverlay";
import { GameScreen } from "./src/components/GameScreen";
import { COLORS } from "./src/theme";

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const setStore = useGameStore((s) => s.set);

  const [fontsLoaded, fontError] = useFonts({
    Jersey10: require("./assets/fonts/Jersey10-Regular.ttf"),
    PixelifySans: require("./assets/fonts/PixelifySans.ttf"),
  });
  useEffect(() => {
    if (fontError) console.warn("Font yüklenemedi (sistem fontuna düşülüyor):", fontError);
  }, [fontError]);

  // Yatay kilit (app.json'a ek — bazı cihazlar onu yok sayar).
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);

  // Sözlüğü bir kez yükle (menü açıkken arkada). Hazır olunca OYNA açılır.
  useEffect(() => {
    let alive = true;
    loadDictionaryAsset()
      .then((n) => {
        if (!alive) return;
        console.log(`Sözlük yüklendi: ${n} kelime`);
        setStore("dictReady", true);
      })
      .catch((err) => {
        console.error("Sözlük yüklenemedi:", err);
      });
    return () => {
      alive = false;
    };
  }, [setStore]);

  // Fontlar yüklenene kadar spinner; HATA olursa yine de devam (sistem fontuna düş).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar hidden />
        {screen === "game" ? <GameScreen onMenu={() => setStore("screen", "menu")} /> : <MenuOverlay />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgDeep },
  center: { alignItems: "center", justifyContent: "center" },
});
