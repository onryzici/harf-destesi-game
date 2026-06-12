// Kör/ante akışı — CLAUDE.md 3.3 / 3.4. Saf mantık, DOM yok.
// Aşama 2: çok kör (küçük→büyük→patron), artan hedefler, kazan/kaybet.

import { dealToHand } from "./dealer.js";
import { scoreWord } from "./scoring.js";
import { isValidWord } from "./dictionary.js";
import { trLower } from "./turkishCase.js";
import { BLINDS } from "../data/blinds.js";
import { blindReward } from "./economy.js";
import { runHooks } from "./hooks.js";
import { pickBoss } from "../data/bosses.js";

// Aktif kör objesi.
export function currentBlind(state) {
  return BLINDS[state.run.blindIndex];
}

// Aktif PATRON'un dağıtıcı kısıtlaması (veri-güdümlü; boss.dealer'dan türetilir).
// Dağıtıcı bununla DAİMA kısıt-uygun bir kelime kurulabilen el verir (oyun kilitlenmesin).
function roundConstraint(state) {
  const c = { minLen: state.config.minWordLength, maxRepeat: Infinity, bannedChars: null };
  const d = state.round.boss?.dealer;
  if (!d) return c;
  if (d.minLen) c.minLen = d.minLen;
  if (d.maxRepeat) c.maxRepeat = d.maxRepeat;
  if (d.banLocked && state.round.lockedChars) {
    c.bannedChars = new Set([...state.round.lockedChars].map((ch) => trLower(ch)));
  }
  return c;
}

// Hedef skor: taban × ante büyümesi × kör katsayısı.
function computeTarget(state, blind) {
  const c = state.config;
  return Math.round(c.targetBase * Math.pow(c.anteGrowth, state.run.ante - 1) * blind.mult);
}

// Aktif köre başlar: hedefi belirle, sayaçları sıfırla, akıllı dağıtıcıyla el ver.
export function startBlind(state) {
  const { round, run, config } = state;
  const blind = currentBlind(state);
  round.blind = blind;
  round.target = computeTarget(state, blind);
  round.score = 0;
  round.playsLeft = config.basePlays;
  round.discardsLeft = config.baseDiscards;
  round.pool = [...run.deck];
  round.hand = [];
  round.lastWordLength = 0;
  round.wordsPlayed = [];
  round.status = "playing";
  round.lastReward = null;
  round.rewardCollected = false;

  // Patron turu ise rastgele (seed'li) bir kısıtlama seç ve uygula.
  round.boss = null;
  round.lockedChars = null;
  if (blind.type === "boss") {
    round.boss = pickBoss(run.rng);
    round.boss.onStart?.(state); // hak/değişim kıs, harf kilitle…
  }

  dealToHand(round.hand, round.pool, config.handSize, run.rng, config.dealer, roundConstraint(state));
}

// Yeni bir run başlatır (ante 1, küçük kör).
export function startRun(state) {
  state.run.ante = 1;
  state.run.blindIndex = 0;
  state.run.money = state.config.startMoney;
  state.run.status = "playing";
  startBlind(state);
}

// ── Yardımcılar ──
function idsToCards(hand, ids) {
  return ids.map((id) => hand.find((c) => c.id === id)).filter(Boolean);
}

function removeFromHand(hand, ids) {
  const set = new Set(ids);
  const removed = hand.filter((c) => set.has(c.id));
  for (let i = hand.length - 1; i >= 0; i--) {
    if (set.has(hand[i].id)) hand.splice(i, 1);
  }
  return removed;
}

function updateStatus(state) {
  const { round, run } = state;
  if (round.score >= round.target) {
    round.status = "won";
  } else if (round.playsLeft <= 0) {
    round.status = "lost";
    run.status = "lost";
  }
}

// Seçili harflerden kelimeyi oynar. selectedIds: oyuncunun dizdiği SIRA ile.
// ok=false ise hak HARCANMAZ.
export function playWord(state, selectedIds) {
  const { round, config, run } = state;
  if (round.status !== "playing") return { ok: false, reason: "bitti" };
  if (round.playsLeft <= 0) return { ok: false, reason: "hakYok" };

  const cards = idsToCards(round.hand, selectedIds);
  if (cards.length < config.minWordLength) return { ok: false, reason: "kısa" };

  const word = cards.map((c) => c.char).join("");
  if (!isValidWord(word, config.minWordLength)) {
    return { ok: false, reason: "gecersiz", word };
  }

  // Patron kısıtlaması: kelime kuralı çiğniyorsa engelle (hak harcanmaz).
  if (round.boss?.validate) {
    const v = round.boss.validate(cards, state);
    if (!v.ok) return { ok: false, reason: v.reason };
  }

  const result = scoreWord(state, cards);
  round.score += result.score;
  round.playsLeft -= 1;
  round.lastWordLength = cards.length;
  round.wordsPlayed.push(word);

  // Run özeti istatistikleri (kazanma/kaybetme ekranı için)
  const stats = run.stats;
  stats.words += 1;
  if (result.score > stats.bestScore) { stats.bestScore = result.score; stats.bestWord = word; }

  // Sadece kullanılan harfler gider; kalanlar elde, akıllı dağıtıcı 8'e tamamlar.
  removeFromHand(round.hand, selectedIds);
  dealToHand(round.hand, round.pool, config.handSize, run.rng, config.dealer, roundConstraint(state));

  updateStatus(state);
  return { ok: true, word, ...result };
}

// Seçili harfleri havuza geri atar ve yeniden çeker. Kelime hakkı harcamaz.
export function discardCards(state, selectedIds) {
  const { round, config, run } = state;
  if (round.status !== "playing") return { ok: false, reason: "bitti" };
  if (round.discardsLeft <= 0) return { ok: false, reason: "atmaYok" };
  if (selectedIds.length === 0) return { ok: false, reason: "seçimYok" };

  const removed = removeFromHand(round.hand, selectedIds);
  round.pool.push(...removed);
  round.discardsLeft -= 1;
  // onDiscard kancası — atılan harfleri görür (İntikam vb. jokerler için).
  runHooks(state, "onDiscard", { state, cards: removed, count: removed.length });
  dealToHand(round.hand, round.pool, config.handSize, run.rng, config.dealer, roundConstraint(state));
  return { ok: true };
}

// Kör geçilince para ödülünü topla (bir kez). Dükkâna girmeden çağrılır.
export function collectBlindReward(state) {
  const { round, run } = state;
  if (round.status !== "won" || round.rewardCollected) return null;
  const reward = blindReward(round.blind, round, run.money);
  run.money += reward.total;
  round.lastReward = reward;
  round.rewardCollected = true;
  // Geçilen kör sayacı (Çığ jokeri için kalıcı çarpan birikimi).
  run.jokerVars.blindsPassed = (run.jokerVars.blindsPassed || 0) + 1;
  return reward;
}

// Sonraki köre/anteye geç. (Dükkândan çıkarken çağrılır.)
// Döndürür: { runWon }
export function proceedToNextBlind(state) {
  const { round, run, config } = state;
  if (round.blind.type === "boss") {
    run.ante += 1;
    run.blindIndex = 0;
  } else {
    run.blindIndex += 1;
  }
  if (run.ante > config.maxAnte) {
    run.status = "won";
    return { runWon: true };
  }
  startBlind(state);
  return { runWon: false };
}

// Kısayol (dükkânsız akış / testler): ödül topla + sonraki köre geç.
export function advanceBlind(state) {
  if (state.round.status !== "won") return { ok: false };
  const reward = collectBlindReward(state);
  const { runWon } = proceedToNextBlind(state);
  return { ok: true, reward, runWon };
}
