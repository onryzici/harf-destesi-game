// Aksiyon butonları — OYNA / DEĞİŞTİR / Temizle. (Web "ATMA"→"DEĞİŞTİR" temizliği.)

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useGameStore } from "../store";
import { play, discard, clearWord } from "../orchestrator";
import { COLORS, FONTS } from "../theme";

function Btn({ label, onPress, kind, disabled }: { label: string; onPress: () => void; kind: "play" | "discard" | "clear"; disabled?: boolean }) {
  const bg = kind === "play" ? COLORS.good : kind === "discard" ? COLORS.chips : COLORS.panel;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
      ]}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export function Actions() {
  useGameStore((s) => s.version);
  const state = useGameStore((s) => s.state);
  const animating = useGameStore((s) => s.animating);
  const word = useGameStore((s) => s.ui.word);

  const over = !state || state.round.status !== "playing" || animating;
  const noSel = word.length === 0;

  return (
    <View style={styles.row}>
      <Btn label="OYNA" kind="play" onPress={play} disabled={over || noSel} />
      <Btn label="DEĞİŞTİR" kind="discard" onPress={discard} disabled={over || noSel} />
      <Btn label="Temizle" kind="clear" onPress={clearWord} disabled={over || noSel} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 10 },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderBottomWidth: 4,
    borderColor: "rgba(0,0,0,0.3)",
    minWidth: 92,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontFamily: FONTS.display, fontSize: 20, letterSpacing: 1 },
});
