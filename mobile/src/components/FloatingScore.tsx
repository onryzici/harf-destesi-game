// Oynanan kelimenin "+skor" rozeti — kelime alanından yukarı süzülüp solar (juice).
// ui.lastPlay.seq değişince tetiklenir. Coşkuya (hype) göre büyür/renklenir.

import React, { useRef, useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { useGameStore } from "../store";
import { COLORS, FONTS } from "../theme";

export function FloatingScore() {
  const lastPlay = useGameStore((s) => s.ui.lastPlay);
  const seq = lastPlay?.seq ?? 0;

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  const [shown, setShown] = useState<typeof lastPlay>(null);

  useEffect(() => {
    if (!lastPlay) return;
    setShown(lastPlay);
    translateY.setValue(10);
    opacity.setValue(1);
    scale.setValue(0.6);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1 + Math.min(0.5, lastPlay.hype * 0.18), friction: 5, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -72, duration: 950, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(480),
        Animated.timing(opacity, { toValue: 0, duration: 470, useNativeDriver: true }),
      ]),
    ]).start(() => setShown(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  if (!shown) return null;
  const color = shown.hype >= 3 ? COLORS.gold : shown.hype >= 2 ? COLORS.multBadge : COLORS.good;

  return (
    <Animated.Text
      pointerEvents="none"
      style={[styles.badge, { color, opacity, transform: [{ translateY }, { scale }] }]}
      allowFontScaling={false}
    >
      +{shown.score}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    alignSelf: "center",
    top: "42%",
    fontFamily: FONTS.display,
    fontSize: 64,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
