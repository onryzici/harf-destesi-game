// Tek doğruluk kaynağı (game state) — CLAUDE.md 7.3. Saf veri + seed'li rng.
// Render bu objeyi OKUR, asla mantık çalıştırmaz.

import { CONFIG } from "../data/config.js";
import { LETTER_BAG } from "../data/letterBag.js";
import { makeRng } from "./rng.js";
import { buildDeck } from "./deck.js";

// Yeni bir run için temiz state üretir.
export function createState(seed = CONFIG.defaultSeed) {
  const deck = buildDeck(LETTER_BAG);
  return {
    run: {
      ante: 1, // 1..maxAnte
      blindIndex: 0, // 0=küçük, 1=büyük, 2=patron
      money: CONFIG.startMoney,
      deck, // harf objeleri (sabit kaynak)
      deckSize: deck.length,
      jokers: [], // Aşama 3
      jokerVars: {}, // run-özel kalıcı joker sayaçları (Harf Simyacısı, Çığ, İntikam…)
      stats: { words: 0, bestWord: "", bestScore: 0 }, // run özeti (kazanma/kaybetme ekranı)
      vouchers: [], // Aşama 4
      shop: null, // körler arası dükkân (engine/shop.js)
      boosterChoices: null, // harf paketi açıkken seçenekler
      nextCardId: deck.length, // deste büyürken benzersiz kart id'si
      seed,
      rng: makeRng(seed), // tüm rastgelelik bundan
      status: "playing", // playing | won (tüm anteler) | lost
    },
    round: {
      blind: null, // aktif tur objesi (data/blinds.js)
      boss: null, // Patron turunda aktif kısıtlama (data/bosses.js), yoksa null
      lockedChars: null, // Sansür patronu için kilitli harfler (Set)
      target: 0,
      score: 0,
      playsLeft: CONFIG.basePlays,
      discardsLeft: CONFIG.baseDiscards,
      pool: [], // çekilebilir kart havuzu (kör başında deste kopyası)
      hand: [], // eldeki harfler
      lastWordLength: 0,
      wordsPlayed: [],
      status: "playing", // playing | won (kör) | lost
      lastReward: null, // kör geçilince ekonomi dökümü
      rewardCollected: false,
    },
    // Engine'in kullandığı ayar kopyası
    config: { ...CONFIG },
  };
}
