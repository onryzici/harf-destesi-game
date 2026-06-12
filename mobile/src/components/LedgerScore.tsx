// Defter skoru — tek satır mürekkep denklemi: "çip 28 × 3 = 84".
// Balatro'nun yan yana mavi/kırmızı kutu + × düzeninin YERİNE: bir defter satırı
// gibi akan, altı çizili ince hesap. Çip mürekkep-mavisi, çarpan mum-kırmızısı,
// toplam altın. Değer değişince yumuşak pop.

import React, { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useGameStore } from "../store";
import { COLORS, FONTS } from "../theme";

export function LedgerScore() {
  useGameStore((s) => s.version);
  const preview = useGameStore((s) => s.ui.preview);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const has = !!preview;
  const chips = preview ? preview.chips : 0;
  const mult = preview ? preview.mult : 0;
  const score = preview ? preview.score : 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: has ? 1 : 0.25, duration: 160, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 80, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
    ]).start();
  }, [chips, mult, score, has, opacity, scale]);

  return (
    <Animated.View style={[styles.line, { opacity, transform: [{ scale }] }]}>
      <Text style={[styles.num, styles.chips]} allowFontScaling={false}>çip {has ? chips : "—"}</Text>
      <Text style={styles.op}> × </Text>
      <Text style={[styles.num, styles.mult]} allowFontScaling={false}>{has ? mult : "—"}</Text>
      <Text style={styles.op}> = </Text>
      <Text style={[styles.num, styles.total]} allowFontScaling={false}>{has ? score : "—"}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderColor: "rgba(243,234,210,0.18)",
    paddingBottom: 4,
    paddingHorizontal: 10,
    alignSelf: "center",
  },
  num: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 38 },
  chips: { color: COLORS.chipBadge },
  mult: { color: COLORS.multBadge },
  total: { color: COLORS.gold },
  op: { color: COLORS.textDim, fontFamily: FONTS.display, fontSize: 26 },
});
