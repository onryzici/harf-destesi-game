// Ana menü — OYNA / DEVAM ET, Nasıl Oynanır. Sözlük yüklenene dek OYNA kilitli
// ("Yükleniyor…"). (Web index.html menu + main.js openMenu muadili.)
// Ayarlar ekranı Faz C'de.

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useGameStore } from "../store";
import { newRun } from "../orchestrator";
import { COLORS, FONTS } from "../theme";

export function MenuOverlay() {
  const dictReady = useGameStore((s) => s.dictReady);
  const started = useGameStore((s) => s.started);
  const setStore = useGameStore((s) => s.set);
  const [howto, setHowto] = useState(false);

  const playLabel = !dictReady ? "Yükleniyor…" : started ? "DEVAM ET" : "OYNA";

  const onPlay = () => {
    if (!dictReady) return;
    if (started) setStore("screen", "game");
    else newRun();
  };

  return (
    <View style={styles.root}>
      {/* Arka plan kimliği — yüzen taş hissi (basit) */}
      <Text style={styles.bgGlyph}>A B C Ç</Text>

      <Text style={styles.logo} allowFontScaling={false}>HARF DESTESİ</Text>
      <Text style={styles.tagline}>Harflerden kelime · kelimeden skor</Text>

      <Pressable
        onPress={onPlay}
        disabled={!dictReady}
        style={({ pressed }) => [styles.play, { opacity: !dictReady ? 0.5 : pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.playText}>{playLabel}</Text>
      </Pressable>

      {started ? (
        <Pressable onPress={() => newRun()} style={styles.secondary}>
          <Text style={styles.secondaryText}>YENİ OYUN</Text>
        </Pressable>
      ) : null}

      <Pressable onPress={() => setHowto((v) => !v)} style={styles.secondary}>
        <Text style={styles.secondaryText}>Nasıl Oynanır</Text>
      </Pressable>

      {howto ? (
        <ScrollView style={styles.howtoBox} contentContainerStyle={{ padding: 14 }}>
          <Text style={styles.howtoText}>
            • Eldeki harflere dokunarak kelime kur, OYNA'ya bas.{"\n"}
            • Skor = ÇİP × ÇARPAN. Uzun kelimeler daha çok kademe çipi/çarpanı verir.{"\n"}
            • Her turda sınırlı kelime hakkın (Hak) ve harf değiştirme hakkın (Değişim) var.{"\n"}
            • Oynanan kelimenin sadece kullandığın harfleri gider; kalanlar elinde durur.{"\n"}
            • Hedef skoru aşarsan turu geçer, para kazanırsın. Patron turları kısıtlama getirir.{"\n"}
            • Tüm bölümleri geç → kazandın.
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bgDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  bgGlyph: {
    position: "absolute",
    top: 18,
    color: "rgba(243,234,210,0.05)",
    fontFamily: FONTS.display,
    fontSize: 90,
    letterSpacing: 20,
  },
  logo: { color: COLORS.gold, fontFamily: FONTS.display, fontSize: 60, letterSpacing: 2, textAlign: "center" },
  tagline: { color: COLORS.textDim, fontFamily: FONTS.pixel, fontSize: 14, marginBottom: 26 },
  play: {
    backgroundColor: COLORS.good,
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 14,
    borderBottomWidth: 5,
    borderColor: "rgba(0,0,0,0.3)",
    marginBottom: 12,
  },
  playText: { color: "#fff", fontFamily: FONTS.display, fontSize: 30, letterSpacing: 1 },
  secondary: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, marginTop: 6 },
  secondaryText: { color: COLORS.text, fontFamily: FONTS.pixel, fontSize: 16 },
  howtoBox: {
    marginTop: 12,
    maxHeight: 130,
    maxWidth: 560,
    backgroundColor: COLORS.panel,
    borderRadius: 12,
  },
  howtoText: { color: COLORS.text, fontSize: 13, lineHeight: 21 },
});
