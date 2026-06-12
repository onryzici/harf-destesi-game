// Seed'li RNG — CLAUDE.md 7.6 / kural 5.
// Math.random() ASLA doğrudan kullanılmaz. Tüm rastgelelik buradan türer,
// böylece bir run tekrar-üretilebilir ve hata ayıklanabilir olur.

// String seed'i 32-bit sayıya hashler (xmur3).
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// mulberry32: hızlı, deterministik 0..1 üreteci.
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bir seed string'inden RNG fonksiyonu üretir: çağırınca [0,1) döndürür.
export function makeRng(seedStr) {
  const seedFn = hashSeed(String(seedStr));
  return mulberry32(seedFn());
}

// [0, n) aralığında tamsayı.
export function randInt(rng, n) {
  return Math.floor(rng() * n);
}

// Diziyi yerinde karıştırır (Fisher-Yates), seed'li RNG ile.
export function shuffle(array, rng) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
