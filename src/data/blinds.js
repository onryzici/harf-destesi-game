// Turlar (blinds) — CLAUDE.md 3.4. Her BÖLÜM 3 turdan oluşur: Tur 1 → Tur 2 →
// Patron. (Poker'in "kör" dili kaldırıldı; mekanik aynı, isimler kelime-oyununa
// özgü.) Patron turun özel kısıtlaması Aşama 6'da gelir. Yapı veri-güdümlü.
// `type` (small/big/boss) MOTOR içindir, değişmez; sadece görünen ad/renk değişti.

export const BLINDS = [
  { type: "small", name: "Tur 1", mult: 1.0, reward: 3, color: "#2f5fa6" },
  { type: "big", name: "Tur 2", mult: 1.5, reward: 4, color: "#d9a441" },
  { type: "boss", name: "Patron", mult: 2.0, reward: 5, color: "#9c3b52" },
];
