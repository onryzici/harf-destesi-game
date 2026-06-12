// Oyun ekranı — "Yazı Masası" düzeni (Balatro yerleşiminden uzak):
//   ÜST   → TopBar (yatay şerit: bölüm/hedef/hak/joker mühürleri) — sol panel YOK
//   ORTA  → kelime "yazı çizgisi" + tek satır defter skoru
//   ALT   → el (harf taşları) + aksiyonlar
// Juice: oynamada ekran sarsıntısı + uçan +skor.

import React, { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameStore } from "../store";
import { TopBar } from "./TopBar";
import { LedgerScore } from "./LedgerScore";
import { WordBoard } from "./WordBoard";
import { Hand } from "./Hand";
import { Actions } from "./Actions";
import { FloatingScore } from "./FloatingScore";
import { RunOverlay } from "./RunOverlay";
import { COLORS, FONTS } from "../theme";

export function GameScreen({ onMenu }: { onMenu: () => void }) {
  useGameStore((s) => s.version);
  const state = useGameStore((s) => s.state);
  const message = useGameStore((s) => s.ui.message);
  const lastPlay = useGameStore((s) => s.ui.lastPlay);
  const seq = lastPlay?.seq ?? 0;

  // Ekran sarsıntısı (oynamada, coşkuya göre).
  const shakeX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!lastPlay || lastPlay.hype < 1) return;
    const amp = 3 + lastPlay.hype * 3;
    Animated.sequence([
      Animated.timing(shakeX, { toValue: amp, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -amp, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: amp * 0.5, duration: 40, useNativeDriver: true }),
      Animated.spring(shakeX, { toValue: 0, friction: 4, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <TopBar onMenu={onMenu} />

      <Animated.View style={[styles.field, { transform: [{ translateX: shakeX }] }]}>
        <View style={styles.center}>
          <WordBoard />
          <LedgerScore />
          <Text style={styles.message} numberOfLines={1}>{message}</Text>
        </View>

        <View style={styles.bottom}>
          <Hand />
          <View style={styles.actionRow}>
            <Actions />
            <Text style={styles.deck}>Deste {state ? state.round.pool.length : 0}</Text>
          </View>
        </View>

        <FloatingScore />
      </Animated.View>

      <RunOverlay />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgFelt },
  field: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  message: { color: COLORS.textDim, fontSize: 12, minHeight: 16 },
  bottom: { paddingBottom: 6, gap: 8 },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 },
  deck: { color: COLORS.textDim, fontFamily: FONTS.pixel, fontSize: 13 },
});
