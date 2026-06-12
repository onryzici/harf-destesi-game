// Ekonomi — CLAUDE.md 3.5. Aşama 2: körü geçince ödül. Dükkân/satış Aşama 4.

import { CONFIG } from "../data/config.js";

// Bir körü geçmenin para ödülünü hesaplar.
// Taban ödül + kalan kelime hakkı başına bonus + faiz (her 5 para için +1).
export function blindReward(blind, round, money) {
  const base = blind.reward;
  const leftover = round.playsLeft * CONFIG.rewardPerLeftoverPlay;
  const interest = Math.min(CONFIG.interestCap, Math.floor(money / CONFIG.interestPer));
  return { base, leftover, interest, total: base + leftover + interest };
}
