// Sayıyı eski değerden yeni değere "tıklayarak" sayar (Balatro count-up hissi).
// Animated.Value'yi dinleyip Text'i günceller (display sürücüsü JS tarafında).

import React, { useRef, useEffect, useState } from "react";
import { Animated, Easing, Text, TextStyle, StyleProp } from "react-native";

export function CountUpText({
  value,
  style,
  duration = 600,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, anim, duration]);

  return (
    <Text style={style} allowFontScaling={false}>
      {display}
    </Text>
  );
}
