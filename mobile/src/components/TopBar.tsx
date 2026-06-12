// Üst şerit ("Yazı Masası" başlığı) — Balatro'nun SOL DİKEY PANELİ yerine yatay,
// tam genişlikte ince bir şerit: bölüm/tur · hedef ilerleme + skor · hak/değişim/para
// · joker mühürleri · menü. Patron turunda altında kırmızı uyarı şeridi.

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useGameStore } from "../store";
import { CountUpText } from "./CountUpText";
import { JokerSeals } from "./JokerSeals";
import { COLORS, FONTS } from "../theme";

function Counter({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={styles.counter}>
      <Text style={[styles.counterValue, { color }]} allowFontScaling={false}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  useGameStore((s) => s.version);
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const { run, round, config } = state;
  const boss = round.boss;
  const pct = round.target > 0 ? Math.min(1, round.score / round.target) : 0;

  return (
    <View>
      <View style={styles.ribbon}>
        {/* Sol: bölüm / tur */}
        <View style={styles.left}>
          <Text style={styles.blind}>{round.blind?.name ?? "—"}</Text>
          <Text style={styles.ante}>BÖLÜM {run.ante}/{config.maxAnte}</Text>
        </View>

        {/* Orta: hedef ilerleme + skor/hedef */}
        <View style={styles.center}>
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>HEDEF</Text>
            <View style={styles.scoreLine}>
              <CountUpText value={round.score} style={styles.score} duration={550} />
              <Text style={styles.targetNum}> / {round.target}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%` }]} />
          </View>
        </View>

        {/* Sağ: sayaçlar + joker mühürleri + menü */}
        <View style={styles.right}>
          <Counter label="HAK" value={round.playsLeft} color={COLORS.good} />
          <Counter label="DEĞİŞ" value={round.discardsLeft} color={COLORS.chipBadge} />
          <Counter label="PARA" value={`$${run.money}`} color={COLORS.gold} />
          <View style={styles.seals}><JokerSeals /></View>
          <Pressable onPress={onMenu} style={styles.menu} hitSlop={8}>
            <Text style={styles.menuText}>☰</Text>
          </Pressable>
        </View>
      </View>

      {boss ? (
        <View style={styles.bossStrip}>
          <Text style={styles.bossText} numberOfLines={1}>
            ⚠ PATRON · {boss.name}: {boss.description}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgDeep,
    borderBottomWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  left: { minWidth: 96 },
  blind: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 24, lineHeight: 26 },
  ante: { color: COLORS.textDim, fontFamily: FONTS.pixel, fontSize: 11, letterSpacing: 0.5 },

  center: { flex: 1, maxWidth: 360 },
  targetRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  targetLabel: { color: COLORS.textDim, fontFamily: FONTS.pixel, fontSize: 11, letterSpacing: 1 },
  scoreLine: { flexDirection: "row", alignItems: "baseline" },
  score: { color: COLORS.text, fontFamily: FONTS.display, fontSize: 26, lineHeight: 28 },
  targetNum: { color: COLORS.textDim, fontFamily: FONTS.display, fontSize: 18 },
  track: { height: 7, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.35)", overflow: "hidden", marginTop: 3 },
  fill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.good },

  right: { flexDirection: "row", alignItems: "center", gap: 14 },
  counter: { alignItems: "center", minWidth: 36 },
  counterValue: { fontFamily: FONTS.display, fontSize: 22, lineHeight: 24 },
  counterLabel: { color: COLORS.textDim, fontFamily: FONTS.pixel, fontSize: 9, letterSpacing: 0.5 },
  seals: { marginLeft: 4 },
  menu: { width: 34, height: 30, borderRadius: 8, backgroundColor: COLORS.panel, alignItems: "center", justifyContent: "center" },
  menuText: { color: COLORS.text, fontSize: 16 },

  bossStrip: {
    backgroundColor: "rgba(192,73,47,0.18)",
    borderBottomWidth: 1,
    borderColor: "rgba(192,73,47,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bossText: { color: "#ff8a6e", fontSize: 12 },
});
