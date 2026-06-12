// Harf çip değerleri (Kelimelik puanları) — CLAUDE.md 3.2 tablosu.
// Anahtarlar Türkçe BÜYÜK harf. Dikkat: "İ" (i'nin büyüğü, 1 çip) ile
// "I" (ı'nın büyüğü, 2 çip) farklı harflerdir.

export const LETTER_VALUES = {
  // 1 çip
  A: 1, E: 1, İ: 1, K: 1, L: 1, N: 1, R: 1, T: 1,
  // 2 çip
  I: 2, M: 2, O: 2, S: 2, U: 2,
  // 3 çip
  B: 3, D: 3, Y: 3, Ü: 3,
  // 4 çip
  C: 4, Ç: 4, Ş: 4, Z: 4,
  // 5 çip
  G: 5, H: 5, P: 5,
  // 7 çip
  F: 7, Ö: 7, V: 7,
  // 8 çip
  Ğ: 8,
  // 10 çip
  J: 10,
};

// Bir harfin çip değerini döndürür (tanımsızsa 0).
export function letterChips(char) {
  return LETTER_VALUES[char] ?? 0;
}
