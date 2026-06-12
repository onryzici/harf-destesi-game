// Kuponlar (vouchers) — CLAUDE.md 3.5. Kalıcı run yükseltmeleri. Veri-güdümlü:
// her kupon bir nesne + apply() fonksiyonu (state.config'i kalıcı değiştirir).

export const VOUCHERS = [
  {
    id: "bol-el", name: "Bol El", cost: 10, icon: "✋",
    description: "El boyutu kalıcı +1 (8 → 9 harf).",
    apply(state) { state.config.handSize += 1; },
  },
  {
    id: "ekstra-hak", name: "Ekstra Hak", cost: 12, icon: "🎟️",
    description: "Kelime hakkı kalıcı +1 (her turda).",
    apply(state) { state.config.basePlays += 1; },
  },
  {
    id: "bol-atma", name: "Bol Atma", cost: 8, icon: "♻️",
    description: "Atma hakkı kalıcı +1 (her turda).",
    apply(state) { state.config.baseDiscards += 1; },
  },
  {
    id: "faizci", name: "Faizci", cost: 10, icon: "🏦",
    description: "Faiz tavanı +3 (daha çok tasarruf geliri).",
    apply(state) { state.config.interestCap += 3; },
  },
];

export function voucherById(id) {
  return VOUCHERS.find((v) => v.id === id) ?? null;
}
