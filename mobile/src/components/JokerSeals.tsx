// Joker mühürleri — üst şeritte küçük "mum mührü" daireleri (Balatro'nun üst joker
// SIRASI değil; ince, damga hissi). Faz A: boş halkalar + dolu olanlarda baş harf.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useGameStore } from "../store";
import { COLORS, FONTS } from "../theme";

const MAX = 5;

export function JokerSeals() {
  useGameStore((s) => s.version);
  const jokers = useGameStore((s) => s.state?.run.jokers) ?? [];

  return (
    <View style={styles.row}>
      {Array.from({ length: MAX }).map((_, i) => {
        const j = jokers[i];
        return (
          <View key={i} style={[styles.seal, j ? styles.sealFilled : styles.sealEmpty]}>
            {j ? <Text style={styles.glyph}>{j.name?.[0] ?? "✦"}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, alignItems: "center" },
  seal: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  sealEmpty: { borderWidth: 1.5, borderColor: "rgba(217,164,65,0.35)", borderStyle: "dashed" },
  sealFilled: { backgroundColor: COLORS.gold, borderWidth: 1.5, borderColor: "#b8862e" },
  glyph: { color: "#3a2a10", fontFamily: FONTS.display, fontSize: 14, fontWeight: "900" },
});
