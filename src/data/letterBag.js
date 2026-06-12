// Başlangıç destesi dağılımı — CLAUDE.md 3.6.
// Türkçe harf sıklığına yakın ~56 harflik çoklu-küme. Sesli oranı ~%36,
// böylece 8'lik eller genelde oynanabilir oluyor.
// Anahtar: Türkçe BÜYÜK harf, değer: o harften kaç adet.

export const LETTER_BAG = {
  // Sesliler (toplam 20)
  A: 5, E: 4, İ: 3, I: 2, O: 2, U: 2, Ö: 1, Ü: 1,

  // Sessizler (toplam 36)
  B: 2, C: 1, Ç: 1, D: 2, F: 1, G: 1, Ğ: 1, H: 1, J: 1,
  K: 3, L: 3, M: 2, N: 3, P: 1, R: 3, S: 2, Ş: 1, T: 3,
  V: 1, Y: 2, Z: 1,
};
