// Kelime alanı — "yazı çizgisi" (Balatro'nun kutu-combo alanı DEĞİL). Harf taşları
// bir parşömen satırının üzerinde durur; geçerli kelimede çizgi yeşile döner (nabız).
// Dokun → ele geri al.

import React, { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet, useWindowDimensions } from "react-native";
import { useGameStore } from "../store";
import { removeTile } from "../orchestrator";
import { Tile } from "./Tile";
import { handTileSize } from "./Hand";
import { COLORS, FONTS } from "../theme";

export function WordBoard() {
  useGameStore((s) => s.version);
  const state = useGameStore((s) => s.state);
  const word = useGameStore((s) => s.ui.word);
  const preview = useGameStore((s) => s.ui.preview);
  const { width } = useWindowDimensions();

  const glow = useRef(new Animated.Value(0)).current;
  const ready = !!(preview && preview.valid);

  useEffect(() => {
    if (ready) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 650, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0.4, duration: 650, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }, [ready, glow]);

  if (!state) return null;
  const byId = new Map(state.round.hand.map((c) => [c.id, c]));
  const cards = word.map((id) => byId.get(id)).filter(Boolean) as { id: number; char: string }[];
  const size = handTileSize(width) + 4;

  const lineColor = glow.interpolate({ inputRange: [0, 1], outputRange: ["rgba(243,234,210,0.22)", COLORS.good] });
  const lineHeight = glow.interpolate({ inputRange: [0, 1], outputRange: [2, 4] });

  return (
    <View style={styles.wrap}>
      {cards.length === 0 ? (
        <Text style={styles.hint}>Harflere dokunarak kelimeni yaz…</Text>
      ) : (
        <View style={styles.row}>
          {cards.map((c) => (
            <Tile key={c.id} char={c.char} size={size} onPress={() => removeTile(c.id)} />
          ))}
        </View>
      )}
      {/* yazı çizgisi (defter satırı) */}
      <Animated.View style={[styles.rule, { backgroundColor: lineColor, height: lineHeight }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", minHeight: 110, paddingHorizontal: 12 },
  hint: { color: COLORS.textDim, fontFamily: FONTS.display, fontSize: 22, marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end" },
  rule: { width: "82%", maxWidth: 620, borderRadius: 2, marginTop: 6 },
});
