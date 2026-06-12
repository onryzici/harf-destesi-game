// Oyun sabitleri — TEK yer (CLAUDE.md kural 6). Aşama 2.

export const CONFIG = {
  // El / oynama mekaniği
  handSize: 8,
  basePlays: 4,
  baseDiscards: 3,
  minWordLength: 2,
  baseMult: 1, // kademe yoksa fallback

  // Hedef eğrisi (Aşama 2: çok kör, artan hedefler)
  maxAnte: 8,
  targetBase: 60, // bölüm 1 ilk tur tabanı
  anteGrowth: 1.8, // her bölüm hedefi bu kat büyür (geç bölümler motor büyütmeyi zorlar)

  // Ekonomi (minimal — tam dükkân Aşama 4)
  startMoney: 4,
  interestPer: 5, // her 5 para için +1 faiz
  interestCap: 5,
  rewardPerLeftoverPlay: 1,

  // Akıllı dağıtıcı (AI) — mantıklı, oynanabilir eller
  dealer: {
    maxAttempts: 24, // en iyi eli ararken deneme sayısı
    minWords: 6, // her el en az bu kadar kelime kurulabilsin
    qualityCap: 12, // kelime sayımını burada kes (hız)
    targetVowelRatio: 0.4,
    vowelTolerance: 0.12,
    vowelPenaltyWeight: 8,
  },

  defaultSeed: "wordtro-001",
  dictionaryUrl: "data/kelimeler.txt",
};
