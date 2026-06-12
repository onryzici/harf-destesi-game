// Jokerler — CLAUDE.md 4. Hepsi VERİ + efekt fonksiyonu. Skorlama mantığına
// serpiştirilmez; yeni joker = bu listeye bir nesne. Soldan sağa işlenir.
//
// ctx: { chips, mult, word, cards, state, preview, addChips(), addMult(), xMult() }
//   - addChips(n): çip ekle | addMult(n): çarpan ekle | xMult(n): çarpanı çarp
//   - preview=true iken (canlı önizleme) RASTGELE/yan-etkili jokerler pas geçmeli.

const VOWELS = new Set(["A", "E", "I", "İ", "O", "Ö", "U", "Ü"]);
const isVowel = (ch) => VOWELS.has(ch);

// Harf -> adet sayımı (tekrar eden harfleri bulmak için).
function charCounts(cards) {
  const c = {};
  for (const card of cards) c[card.char] = (c[card.char] || 0) + 1;
  return c;
}

export const JOKERS = [
  {
    id: "sesli-avcisi", name: "Sesli Avcısı", rarity: "common", cost: 4, icon: "🎯",
    description: "Kelimedeki her sesli harf için +2 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        const v = ctx.cards.filter((c) => isVowel(c.char)).length;
        if (v) ctx.addMult(2 * v);
      },
    },
  },
  {
    id: "ikizler", name: "İkizler", rarity: "common", cost: 4, icon: "👯",
    description: "Tekrar eden her harf çifti için +15 Çip.",
    hooks: {
      onWordScored(ctx) {
        const cnt = charCounts(ctx.cards);
        let pairs = 0;
        for (const k in cnt) pairs += Math.floor(cnt[k] / 2);
        if (pairs) ctx.addChips(15 * pairs);
      },
    },
  },
  {
    id: "kose-tasi", name: "Köşe Taşı", rarity: "common", cost: 4, icon: "🧱",
    description: "Kelimenin ilk ve son harfi aynıysa +30 Çip.",
    hooks: {
      onWordScored(ctx) {
        const a = ctx.cards;
        if (a.length >= 2 && a[0].char === a[a.length - 1].char) ctx.addChips(30);
      },
    },
  },
  {
    id: "cimri", name: "Cimri", rarity: "uncommon", cost: 6, icon: "🪙",
    description: "3 harf ve altı kelimeler ×3 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        if (ctx.cards.length <= 3) ctx.xMult(3);
      },
    },
  },
  {
    id: "mimar", name: "Mimar", rarity: "uncommon", cost: 6, icon: "📐",
    description: "6+ harfli kelime: harf sayısı × 8 Çip.",
    hooks: {
      onWordScored(ctx) {
        const n = ctx.cards.length;
        if (n >= 6) ctx.addChips(n * 8);
      },
    },
  },
  {
    id: "turkce-belasi", name: "Türkçe Belası", rarity: "uncommon", cost: 6, icon: "🔥",
    description: "8+ harfli kelime: +100 Çip ve +8 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        if (ctx.cards.length >= 8) {
          ctx.addChips(100);
          ctx.addMult(8);
        }
      },
    },
  },
  {
    id: "zincir", name: "Zincir", rarity: "uncommon", cost: 6, icon: "⛓️",
    description: "Her kelime bir öncekinden uzunsa +4 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        if (ctx.cards.length > ctx.state.round.lastWordLength) ctx.addMult(4);
      },
    },
  },
  {
    id: "kumarbaz", name: "Kumarbaz", rarity: "uncommon", cost: 5, icon: "🎲",
    description: "Her kelimede %50 ihtimalle ×2 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        if (ctx.preview) return; // önizlemede zar atma
        if (ctx.state.run.rng() < 0.5) ctx.xMult(2);
      },
    },
  },
  {
    id: "simbiyoz", name: "Simbiyoz", rarity: "rare", cost: 8, icon: "🌿",
    description: "Her sesli için +3 Çip, her sessiz için +1 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        let v = 0, c = 0;
        for (const card of ctx.cards) isVowel(card.char) ? v++ : c++;
        if (v) ctx.addChips(3 * v);
        if (c) ctx.addMult(c);
      },
    },
  },
  {
    id: "borsa", name: "Borsa", rarity: "uncommon", cost: 6, icon: "📈",
    description: "Paran her 4 birim için +1 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        const m = Math.floor(ctx.state.run.money / 4);
        if (m) ctx.addMult(m);
      },
    },
  },

  // ── Risk / kaos jokerleri (CLAUDE.md 4.2 — patlama hissi) ──
  {
    id: "palindrom-tanrisi", name: "Palindrom Tanrısı", rarity: "legendary", cost: 9, icon: "🪞",
    description: "Palindrom kelime (tersten aynı): ×20 Çarpan!",
    hooks: {
      onWordScored(ctx) {
        const w = ctx.cards.map((c) => c.char);
        if (w.length >= 2 && w.join("") === [...w].reverse().join("")) ctx.xMult(20);
      },
    },
  },
  {
    id: "harf-simyacisi", name: "Harf Simyacısı", rarity: "rare", cost: 7, icon: "⚗️",
    description: "Oynadığın her 'A' bu jokeri KALICI +1 Çarpan büyütür (run boyunca).",
    hooks: {
      onWordScored(ctx) {
        const v = ctx.state.run.jokerVars;
        const aNow = ctx.cards.filter((c) => c.char === "A").length;
        const base = v.harfSimyacisi || 0;
        if (!ctx.preview) v.harfSimyacisi = base + aNow; // kalıcı büyüme (oynanınca)
        const total = base + aNow; // önizlemede bu kelimenin A'larını da göster
        if (total) ctx.addMult(total);
      },
    },
  },
  {
    id: "anagram-seytani", name: "Anagram Şeytanı", rarity: "rare", cost: 7, icon: "🔀",
    description: "Bu turda daha önce oynadığın bir kelimenin anagramını oynarsan ×3 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        const sig = (w) => [...w].sort().join("");
        const cur = sig(ctx.word);
        const prev = ctx.state.round.wordsPlayed;
        if (prev.some((w) => w !== ctx.word && sig(w) === cur)) ctx.xMult(3);
      },
    },
  },
  {
    id: "sonsuz", name: "Sonsuz", rarity: "legendary", cost: 9, icon: "♾️",
    description: "Tur skoru 1000'i geçtiyse kalan kelimelerde ×3 Çarpan.",
    hooks: {
      onWordScored(ctx) {
        if (ctx.state.round.score >= 1000) ctx.xMult(3);
      },
    },
  },
  {
    id: "intikam", name: "İntikam", rarity: "common", cost: 4, icon: "⚔️",
    description: "Attığın her harf, SIRADAKİ kelimene +5 Çip ekler.",
    hooks: {
      onDiscard(ctx) {
        const v = ctx.state.run.jokerVars;
        v.intikam = (v.intikam || 0) + ctx.count;
      },
      onWordScored(ctx) {
        const v = ctx.state.run.jokerVars;
        const pending = v.intikam || 0;
        if (pending) ctx.addChips(5 * pending);
        if (!ctx.preview) v.intikam = 0; // tüketildi (gerçek oynamada sıfırla)
      },
    },
  },
  {
    id: "cig", name: "Çığ", rarity: "uncommon", cost: 6, icon: "❄️",
    description: "Geçtiğin her tur için kalıcı +1 Çarpan (oyun boyunca büyür).",
    hooks: {
      onWordScored(ctx) {
        const n = ctx.state.run.jokerVars.blindsPassed || 0;
        if (n) ctx.addMult(n);
      },
    },
  },
];

// Nadirlik renkleri (görsel katman kullanır — yine de veride durur).
export const RARITY_COLORS = {
  common: "#5b8fb0",
  uncommon: "#4aa3ff",
  rare: "#ff5a4d",
  legendary: "#ffcb45",
};

// id ile joker bul.
export function jokerById(id) {
  return JOKERS.find((j) => j.id === id) ?? null;
}
