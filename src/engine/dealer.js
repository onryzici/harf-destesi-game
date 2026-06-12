// Akıllı dağıtıcı (AI) — CLAUDE.md kural 5 (seed'li). Saf mantık, DOM yok.
//
// Amaç: oyuncuya "mantıklı harfler" gelsin. Her el dağıtılırken, eldeki
// harflerle kelime kurulabildiğini ve sesli/sessiz dengesinin makul olduğunu
// GARANTİ ETMEYE çalışır. Bu bir LLM değil — hızlı, çevrimdışı, deterministik
// bir sezgisel arama. Aynı seed = aynı eller (tekrar-üretilebilir).
//
// Yöntem: pool'dan birkaç aday el dener (seed'li karıştırmayla), her elin
// "kalitesini" puanlar (kaç kelime kurulabilir + sesli oranı), en iyisini seçer.

import { shuffle } from "./rng.js";
import { getWordSet } from "./dictionary.js";
import { trLower } from "./turkishCase.js";

const TR_VOWELS = new Set(["A", "E", "I", "İ", "O", "Ö", "U", "Ü"]);

// Sözlükten, ele sığabilecek kelimelerin harf-sayım imzaları (bir kez, önbellek).
let cachedCandidates = null;
let cachedForSize = -1;

function buildCandidates(handSize) {
  if (cachedCandidates && cachedForSize === handSize) return cachedCandidates;
  const set = getWordSet();
  const list = [];
  for (const w of set) {
    if (w.length < 2 || w.length > handSize) continue;
    const counts = {};
    for (const ch of w) counts[ch] = (counts[ch] || 0) + 1;
    list.push({ len: w.length, counts });
  }
  cachedCandidates = list;
  cachedForSize = handSize;
  return list;
}

// Eldeki harflerin (küçük harf) sayımı.
function letterCounts(cards) {
  const counts = {};
  let total = 0;
  for (const c of cards) {
    const ch = trLower(c.char);
    counts[ch] = (counts[ch] || 0) + 1;
    total++;
  }
  return { counts, total };
}

// Bu elle kaç farklı geçerli kelime kurulabilir (cap'te kesilir — hız).
function countFormable(cards, candidates, cap) {
  const { counts, total } = letterCounts(cards);
  let n = 0;
  for (const cand of candidates) {
    if (cand.len > total) continue;
    let ok = true;
    for (const ch in cand.counts) {
      if ((counts[ch] || 0) < cand.counts[ch]) {
        ok = false;
        break;
      }
    }
    if (ok && ++n >= cap) return n;
  }
  return n;
}

// Bir aday kelime, aktif PATRON kısıtlamasına uyuyor mu?
// (minLen: en az uzunluk; maxRepeat: aynı harf en çok; bannedChars: kilitli harfler.)
function candidateOk(cand, constraint) {
  if (cand.len < constraint.minLen) return false;
  if (constraint.maxRepeat < Infinity) {
    for (const ch in cand.counts) if (cand.counts[ch] > constraint.maxRepeat) return false;
  }
  if (constraint.bannedChars) {
    for (const ch in cand.counts) if (constraint.bannedChars.has(ch)) return false;
  }
  return true;
}

// Bu elle, KISITLAMAYA UYAN kaç kelime kurulabilir (cap'te kesilir).
function countFormableConstrained(cards, candidates, constraint, cap) {
  const { counts, total } = letterCounts(cards);
  let n = 0;
  for (const cand of candidates) {
    if (cand.len > total) continue;
    if (!candidateOk(cand, constraint)) continue;
    let ok = true;
    for (const ch in cand.counts) {
      if ((counts[ch] || 0) < cand.counts[ch]) { ok = false; break; }
    }
    if (ok && ++n >= cap) return n;
  }
  return n;
}

// Kısıt aktif mi (varsayılan = etkisiz)?
function constraintActive(c) {
  return !!c && (c.minLen > 2 || (c.bannedChars && c.bannedChars.size > 0) || c.maxRepeat < Infinity);
}

// GARANTİ kurucu: kısıt-uygun bir kelimeyi (ele+havuza sığan) kuracak harfleri
// havuzdan seçer, kalan slotları rastgele doldurur. 'need' kart döndürür ya da null.
// Deterministik: adaylar sırayla denenir, doldurma seed'li rng ile.
function pickConstraintDraw(hand, pool, need, constraint, candidates, rng) {
  const handCounts = letterCounts(hand).counts;
  const poolByChar = {};
  for (const c of pool) {
    const ch = trLower(c.char);
    (poolByChar[ch] = poolByChar[ch] || []).push(c);
  }
  for (const cand of candidates) {
    if (!candidateOk(cand, constraint)) continue;
    // ele+havuza sığıyor mu ve en çok 'need' yeni harf mi gerektiriyor?
    let feasible = true, extra = 0;
    for (const ch in cand.counts) {
      const have = handCounts[ch] || 0;
      const avail = poolByChar[ch] ? poolByChar[ch].length : 0;
      if (cand.counts[ch] > have + avail) { feasible = false; break; }
      extra += Math.max(0, cand.counts[ch] - have);
    }
    if (!feasible || extra > need) continue;

    // Gereken harfleri havuzdan seç.
    const draw = [];
    const used = new Set();
    const poolCopy = {};
    for (const ch in poolByChar) poolCopy[ch] = [...poolByChar[ch]];
    let okBuild = true;
    for (const ch in cand.counts) {
      let needCh = Math.max(0, cand.counts[ch] - (handCounts[ch] || 0));
      while (needCh-- > 0) {
        const arr = poolCopy[ch];
        if (!arr || arr.length === 0) { okBuild = false; break; }
        const card = arr.shift();
        draw.push(card);
        used.add(card.id);
      }
      if (!okBuild) break;
    }
    if (!okBuild) continue;

    // Kalan slotları rastgele (seed'li) doldur.
    const rest = shuffle(pool.filter((c) => !used.has(c.id)), rng);
    for (const c of rest) {
      if (draw.length >= need) break;
      draw.push(c);
    }
    if (draw.length >= need) return draw.slice(0, need);
  }
  return null;
}

function vowelRatio(cards) {
  if (cards.length === 0) return 0;
  let v = 0;
  for (const c of cards) if (TR_VOWELS.has(c.char)) v++;
  return v / cards.length;
}

// El kalitesi: çok kelime kurulabilmesi iyi; sesli oranı hedefe yakın olması iyi.
function scoreHand(cards, candidates, cfg) {
  const words = countFormable(cards, candidates, cfg.qualityCap);
  const vr = vowelRatio(cards);
  const penalty = Math.abs(vr - cfg.targetVowelRatio) * cfg.vowelPenaltyWeight;
  return { words, vr, score: words - penalty };
}

// Pool'dan, mevcut eli oynanabilir kılacak 'need' kart seçer.
// hand ve pool'u MUTASYONA uğratır. Deterministik (run.rng).
// constraint (ops.): aktif PATRON kısıtlaması — el DAİMA kısıt-uygun bir kelime
// kurabilsin diye dağıtım buna göre yapılır (oyun kilitlenmesin).
export function dealToHand(hand, pool, handSize, rng, cfg, constraint) {
  const need = Math.min(handSize - hand.length, pool.length);
  if (need <= 0) return;
  const candidates = buildCandidates(handSize);
  const active = constraintActive(constraint);
  const maxAttempts = active ? cfg.maxAttempts * 2 : cfg.maxAttempts;

  let best = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Her deneme rng'yi ilerletir -> seed'e bağlı ama çeşitli.
    const draw = shuffle([...pool], rng).slice(0, need);
    const full = hand.concat(draw);
    const q = scoreHand(full, candidates, cfg);
    const constrained = active ? countFormableConstrained(full, candidates, constraint, 1) : 1;
    const cand = { draw, q, constrained };

    // Kısıt aktifse, kısıt-uygun el her zaman önceliklidir; sonra skor.
    const better =
      !best ||
      (active && cand.constrained >= 1 && best.constrained < 1) ||
      ((!active || cand.constrained >= 1 === best.constrained >= 1) && q.score > best.q.score);
    if (better) best = cand;

    const vowelOk = Math.abs(q.vr - cfg.targetVowelRatio) <= cfg.vowelTolerance;
    if (q.words >= cfg.minWords && vowelOk && constrained >= 1) {
      best = cand;
      break;
    }
  }

  // GARANTİ: kısıtlı tur ama seçilen elde kısıt-uygun kelime yoksa, eli elle kur.
  if (active && best.constrained < 1) {
    const forced = pickConstraintDraw(hand, pool, need, constraint, candidates, rng);
    if (forced) {
      best = { draw: forced, q: scoreHand(hand.concat(forced), candidates, cfg), constrained: 1 };
    }
  }

  // Seçileni pool'dan çıkar, ele ekle.
  const chosen = new Set(best.draw.map((c) => c.id));
  for (let i = pool.length - 1; i >= 0; i--) {
    if (chosen.has(pool[i].id)) pool.splice(i, 1);
  }
  hand.push(...best.draw);
}
