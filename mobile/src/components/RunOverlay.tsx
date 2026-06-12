// Tur/run sonu overlay'i — Tur Geçildi (→ Devam), Oyun Bitti (→ Yeniden Oyna),
// KAZANDIN (tüm bölümler). Faz A: dükkânsız; "Devam" doğrudan sonraki tura geçer.
// (Dükkân Faz B'de "Devam" ile sonraki tur arasına girecek.)

import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useGameStore } from "../store";
import { collectRewardNow, proceedAfterWin, newRun } from "../orchestrator";
import { COLORS, FONTS } from "../theme";

export function RunOverlay() {
  useGameStore((s) => s.version);
  const state = useGameStore((s) => s.state);

  const runWon = state?.run.status === "won";
  const roundWon = state?.round.status === "won" && state?.run.status === "playing";
  const lost = state?.round.status === "lost";
  const show = !!(runWon || roundWon || lost);

  // Tur geçildiğinde parayı topla (idempotent) — ödül kutusunu doldurur.
  useEffect(() => {
    if (roundWon) collectRewardNow();
  }, [roundWon, state?.run.ante, state?.run.blindIndex]);

  if (!state || !show) return null;

  let title = "";
  let body: React.ReactNode = null;
  let btnLabel = "";
  let onPress = () => {};

  if (runWon) {
    title = "KAZANDIN!";
    body = <Text style={styles.text}>Tüm bölümleri geçtin. Efsane.</Text>;
    btnLabel = "Yeni Oyun";
    onPress = newRun;
  } else if (roundWon) {
    const r = state.round.lastReward;
    title = "Tur Geçildi!";
    body = (
      <>
        <Text style={styles.text}>
          {state.round.blind?.name}: {state.round.score} / {state.round.target}
        </Text>
        {r ? (
          <Text style={styles.reward}>
            Ödül +${r.total}  (taban {r.base} + hak {r.leftover} + faiz {r.interest})
          </Text>
        ) : null}
      </>
    );
    btnLabel = "Devam Et →";
    onPress = () => proceedAfterWin();
  } else {
    title = "Oyun Bitti";
    body = (
      <>
        <Text style={styles.text}>
          Hedefe ulaşamadın: {state.round.score} / {state.round.target}
        </Text>
        <View style={styles.stats}>
          <Stat label="Ulaşılan Bölüm" value={`${state.run.ante}/${state.config.maxAnte}`} />
          <Stat label="Oynanan kelime" value={state.run.stats.words} />
          <Stat label="En iyi" value={state.run.stats.bestWord ? `${state.run.stats.bestWord} · ${state.run.stats.bestScore}` : "—"} />
          <Stat label="Kalan para" value={`$${state.run.money}`} />
        </View>
      </>
    );
    btnLabel = "Yeniden Oyna";
    onPress = newRun;
  }

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {body}
        <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.btnText}>{btnLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8,9,20,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.bgDeep,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: "center",
    maxWidth: 460,
  },
  title: { color: COLORS.gold, fontFamily: FONTS.display, fontSize: 40, marginBottom: 8 },
  text: { color: COLORS.text, fontSize: 15, textAlign: "center", marginBottom: 4 },
  reward: { color: COLORS.gold, fontSize: 14, textAlign: "center", marginTop: 2 },
  stats: { marginTop: 12, width: 300 },
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  statLabel: { color: COLORS.textDim, fontSize: 13 },
  statValue: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  btn: {
    marginTop: 18,
    backgroundColor: COLORS.good,
    paddingVertical: 11,
    paddingHorizontal: 30,
    borderRadius: 12,
    borderBottomWidth: 4,
    borderColor: "rgba(0,0,0,0.3)",
  },
  btnText: { color: "#fff", fontFamily: FONTS.display, fontSize: 22, letterSpacing: 1 },
});
