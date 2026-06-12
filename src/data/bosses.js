// Patron kısıtlamaları (boss modifiers) — CLAUDE.md 5. Oyuncuyu motorunu farklı
// kullanmaya ZORLAR; zorluğun zirvesi. Tıpkı jokerler gibi VERİ-GÜDÜMLÜ:
//   - description: oyuncuya gösterilen kural
//   - onStart(state): tur başında bir kez uygulanır (hak/değişim kıs, harf kilitle…)
//   - validate(cards, state) -> {ok, reason}: kelime oynanmadan ÖNCE kontrol (bloklar)
//   - hooks.onWordScored(ctx): skorlama sırasında ceza uygular (jokerlerden SONRA çalışır)
//
// Patron sadece "Patron" turunda (blind.type === "boss") seçilir; seed'li rng ile.

const VOWELS = new Set(["A", "E", "I", "İ", "O", "Ö", "U", "Ü"]);
// Sansür'ün kilitleyebileceği harfler — sadece ünsüzler (sesliler hep açık kalsın
// ki kelime kurulabilsin; aksi halde el oynanamaz hale gelebilir).
const LOCKABLE = ["K", "L", "N", "R", "T", "M", "S", "B", "D", "Y", "Ç", "Ş", "Z", "G", "H", "P"];

function pickN(arr, n, rng) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

export const BOSSES = [
  {
    id: "uzun-yol", name: "Uzun Yol", icon: "📏",
    description: "Kelimeler en az 5 harf olmalı.",
    // Dağıtıcı garantisi: el daima en az 5 harflik bir kelime kurabilsin (oyun kilitlenmesin).
    dealer: { minLen: 5 },
    validate(cards) {
      return cards.length >= 5 ? { ok: true } : { ok: false, reason: "uzunYol" };
    },
  },
  {
    id: "tekel", name: "Tekel", icon: "⛓️",
    description: "Aynı harf bir kelimede 2'den fazla kullanılamaz.",
    dealer: { maxRepeat: 2 },
    validate(cards) {
      const c = {};
      for (const card of cards) {
        c[card.char] = (c[card.char] || 0) + 1;
        if (c[card.char] > 2) return { ok: false, reason: "tekel" };
      }
      return { ok: true };
    },
  },
  {
    id: "acgozlu", name: "Açgözlü", icon: "💰",
    description: "Bu turda değişim (atma) hakkın yok.",
    onStart(state) { state.round.discardsLeft = 0; },
  },
  {
    id: "darbogaz", name: "Darboğaz", icon: "⏳",
    description: "Bu turda bir kelime hakkın eksik.",
    onStart(state) { state.round.playsLeft = Math.max(1, state.round.playsLeft - 1); },
  },
  {
    id: "kisirlik", name: "Kısırlık", icon: "🌵",
    description: "İlk oynadığın kelime sayılmaz (0 puan).",
    hooks: {
      onWordScored(ctx) {
        if (ctx.state.round.wordsPlayed.length === 0) { ctx.chips = 0; ctx.mult = 0; }
      },
    },
  },
  {
    id: "vergi", name: "Vergi", icon: "⚖️",
    description: "Her kelimede çarpanın yarısı vergi olarak alınır (×0.5).",
    hooks: {
      onWordScored(ctx) { ctx.xMult(0.5); },
    },
  },
  {
    id: "sansur", name: "Sansür", icon: "🚫",
    description: "Rastgele 3 harf bu turda kilitli (kullanılamaz).",
    dealer: { banLocked: true }, // dağıtıcı kilitli harfsiz kelime kurulabilen el versin
    onStart(state) {
      state.round.lockedChars = new Set(pickN(LOCKABLE, 3, state.run.rng));
    },
    validate(cards, state) {
      const locked = state.round.lockedChars;
      if (locked && cards.some((c) => locked.has(c.char))) return { ok: false, reason: "sansur" };
      return { ok: true };
    },
  },
];

// Seed'li rng ile bir patron seç (sadece Patron turunda çağrılır).
export function pickBoss(rng) {
  return BOSSES[Math.floor(rng() * BOSSES.length)];
}

export function bossById(id) {
  return BOSSES.find((b) => b.id === id) ?? null;
}
