// "Mürekkep & Parşömen" tasarım dili — CLAUDE.md 6.1 / web style.css :root ile senkron.
// Renkler ve font adları TEK yer; bileşenler buradan okur (kural 6: sihirli değer yok).

export const COLORS = {
  bgDeep: "#11142a", // en koyu indigo zemin
  bgFelt: "#1b1f3a", // masa indigo
  cardFace: "#efe3c8", // parşömen kart yüzeyi
  cardEdge: "#16142e", // mürekkep/koyu kenar
  chips: "#2f5fa6", // çip = mürekkep mavisi
  mult: "#c0492f", // çarpan = mum kırmızısı
  gold: "#d9a441", // para/altın
  good: "#4f9d6b", // geçerli (yeşil mürekkep)
  text: "#f3ead2", // parşömen yazı
  // Uçan rozet vurguları (scoreSequence)
  chipBadge: "#7fb3ff",
  multBadge: "#ff8a6e",
  // Yardımcılar
  textDim: "rgba(243,234,210,0.55)",
  line: "rgba(243,234,210,0.14)",
  panel: "#232744",
  danger: "#c0492f",
};

// Fontlar — pixel kimliği HUD/başlık/skor; kart harfleri okunurluk için sistem-kalın.
export const FONTS = {
  display: "Jersey10", // büyük başlık / skor okuması
  pixel: "PixelifySans", // HUD etiketleri / ikincil
};

// Nadirlik renkleri (joker kartları)
export const RARITY: Record<string, string> = {
  common: "#9fb0c9",
  uncommon: "#4f9d6b",
  rare: "#2f5fa6",
  legendary: "#d9a441",
};
