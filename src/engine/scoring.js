// Skorlama — CLAUDE.md 3.2 / 7.4. EN kritik kısım. Saf mantık, DOM yok.
//
// score = chips × mult
// Sıra (jokerlerin doğru tetiklenmesi için ÖNEMLİ):
//   1. chips = harf çip değerlerini topla
//   2. her harf için onLetterScored
//   3. kelime uzunluğu kademesinin taban çip + çarpanı uygulanır
//   4. tüm kelime için onWordScored (jokerler burada)
//   5. score = chips × mult
//
// AYRICA: skorlama sıralı bir `timeline` (zaman çizelgesi) üretir — her harfin,
// her kademenin ve her jokerin katkısı SIRAYLA kaydedilir. Render katmanı bunu
// adım adım oynatır (Balatro'nun "tek tek sayma" dopamin anı). Bu SAF VERİDİR;
// engine DOM'a dokunmaz (CLAUDE.md 7.2).

import { letterChips } from "../data/letterValues.js";
import { wordTier } from "../data/wordTiers.js";
import { runHooks } from "./hooks.js";

// Skorlama bağlamı. Taban çarpan kelime uzunluğu kademesinden gelir.
// preview=true: canlı önizleme — rastgele/yan-etkili jokerler tetiklenmez.
//
// addChips/addMult/xMult her çağrıldığında `_ops`'a bir kayıt düşer; böylece
// hangi kaynağın (harf/joker) ne yaptığını sıralı olarak zaman çizelgesine
// yazabiliriz (görsel oynatma için).
function makeContext(state, cards, preview) {
  const tier = wordTier(cards.length);
  return {
    chips: 0,
    mult: tier.mult,
    tier,
    word: cards.map((c) => c.char).join(""),
    cards,
    state,
    preview,
    _fired: new Set(), // tetiklenen joker id'leri (görsel için)
    _ops: [], // sıralı işlem kaydı: {op:'chip'|'mult'|'xmult', n}
    _timeline: null, // scoreWord doldurur (joker adımları buraya eklenir)
    addChips(n) {
      this.chips += n;
      this._ops.push({ op: "chip", n });
    },
    addMult(n) {
      this.mult += n;
      this._ops.push({ op: "mult", n });
    },
    xMult(n) {
      this.mult *= n;
      this._ops.push({ op: "xmult", n });
    },
  };
}

// Bir kelimeyi (kart dizisi) puanlar. State'i DEĞİŞTİRMEZ (preview hariç
// rastgele jokerler state.run.rng'yi ilerletebilir — bu kasıtlı/deterministik).
// Döndürür: { chips, mult, score, timeline, tier, firedJokers }
export function scoreWord(state, cards, opts = {}) {
  const ctx = makeContext(state, cards, !!opts.preview);
  const timeline = [];
  ctx._timeline = timeline;

  // 1 + 2) harf çipleri ve her harf için onLetterScored
  for (const card of cards) {
    const base = letterChips(card.char);
    ctx.chips += base;
    const opStart = ctx._ops.length;
    ctx.card = card;
    runHooks(state, "onLetterScored", ctx); // harf-üstü efektler/jokerler
    ctx.card = null;
    timeline.push({
      kind: "letter",
      char: card.char,
      base,
      ops: ctx._ops.slice(opStart),
      chips: ctx.chips,
      mult: ctx.mult,
    });
  }

  // 3) kelime uzunluğu kademesi taban çipi (mult kademe ile başlamıştı)
  ctx.chips += ctx.tier.bonusChips;
  timeline.push({
    kind: "tier",
    label: ctx.tier.label,
    base: ctx.tier.bonusChips,
    ops: [],
    chips: ctx.chips,
    mult: ctx.mult,
  });

  // 4) tüm kelime için onWordScored (jokerler soldan sağa — runHooks her
  //    tetiklenen jokeri timeline'a "joker" adımı olarak ekler)
  runHooks(state, "onWordScored", ctx);

  // 5) score = chips × mult
  const score = Math.round(ctx.chips * ctx.mult);
  return {
    chips: ctx.chips,
    mult: ctx.mult,
    score,
    timeline,
    tier: ctx.tier,
    firedJokers: [...ctx._fired],
  };
}
