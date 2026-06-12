// El — eldeki harfler (kelime alanına taşınanlar hariç). Dokun → kelimeye ekle.
// (Web renderHand.js + tap fallback'in muadili.)

import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useGameStore } from "../store";
import { placeTile } from "../orchestrator";
import { Tile } from "./Tile";

// El taşı boyutunu ekran genişliğine göre uyarla — 8 taş tek sırada sığsın
// (dar yatay ekranlarda, ör. iPhone SE 667px, taşma olmasın).
// Sol panel yok ("Yazı Masası") → el tüm genişliği kullanır. 8 taş tek sırada sığar.
export function handTileSize(screenW: number, count = 8) {
  const avail = screenW - 36; // sadece kenar boşlukları
  const perWidth = avail / count - 10; // taş başına genişlik (margin hariç)
  const size = perWidth / 0.8; // genişlik = size*0.8 → size'a çevir
  return Math.max(50, Math.min(86, Math.floor(size)));
}

export function Hand() {
  // version → mutasyon sonrası yeniden oku; ui.word → dizilenleri ele'den düş.
  useGameStore((s) => s.version);
  const state = useGameStore((s) => s.state);
  const word = useGameStore((s) => s.ui.word);
  const { width } = useWindowDimensions();

  if (!state) return null;
  const staged = new Set(word);
  const tiles = state.round.hand.filter((c) => !staged.has(c.id));
  const size = handTileSize(width);

  return (
    <View style={styles.row}>
      {tiles.map((c) => (
        <Tile key={c.id} char={c.char} size={size} onPress={() => placeTile(c.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
});
