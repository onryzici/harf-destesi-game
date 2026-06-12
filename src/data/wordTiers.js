// Kelime uzunluğu kademeleri — Balatro'nun "poker eli" muadili.
// Uzun kelime = taban çip + taban çarpan. Veri-güdümlü; koda gömülmez.
// (CLAUDE.md 3.2 güncellendi: taban çarpan artık kademeden gelir.)

export const WORD_TIERS = [
  { min: 2, max: 3, bonusChips: 0, mult: 1, label: "Kısa" },
  { min: 4, max: 5, bonusChips: 20, mult: 2, label: "Orta" },
  { min: 6, max: 7, bonusChips: 40, mult: 3, label: "Uzun" },
  { min: 8, max: Infinity, bonusChips: 60, mult: 4, label: "Destansı" },
];

// Verilen harf sayısına uyan kademeyi döndürür.
export function wordTier(len) {
  return WORD_TIERS.find((t) => len >= t.min && len <= t.max) ?? WORD_TIERS[0];
}
