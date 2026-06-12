// Harf taşı — parşömen kart (el + kelime alanı ortak). "Tok ve fiziksel" his:
// kalın koyu kenar, iç gölge, büyük okunur harf, köşede çip değeri. (CLAUDE.md 6.2)
// Juice: desteden-geliş (mount'ta pop) + basışta zıplama (Animated).

import React, { useRef, useEffect } from "react";
import { Pressable, Text, Animated, StyleSheet } from "react-native";
import { letterChips } from "../engineApi";
import { COLORS } from "../theme";

interface Props {
  char: string;
  onPress?: () => void;
  size?: number; // taş yüksekliği (px); genişlik orantılı
}

function TileBase({ char, onPress, size = 84 }: Props) {
  const w = size * 0.8;
  const chip = letterChips(char);

  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Desteden geliş: pop + fade-in.
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const press = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 6, tension: 200, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={() => press(1.08)} onPressOut={() => press(1)}>
      <Animated.View style={[styles.face, { width: w, height: size, opacity, transform: [{ scale }] }]}>
        <Text style={[styles.char, { fontSize: size * 0.46 }]} allowFontScaling={false}>
          {char}
        </Text>
        <Text style={[styles.chip, { fontSize: size * 0.17 }]} allowFontScaling={false}>
          {chip}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export const Tile = React.memo(TileBase);

const styles = StyleSheet.create({
  face: {
    margin: 5,
    backgroundColor: COLORS.cardFace,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.cardEdge,
    borderBottomWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  char: {
    color: "#241c12",
    fontWeight: "900",
    includeFontPadding: false,
  },
  chip: {
    position: "absolute",
    right: 5,
    bottom: 3,
    color: COLORS.chips,
    fontWeight: "800",
  },
});
