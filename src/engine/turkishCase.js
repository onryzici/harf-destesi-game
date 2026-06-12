// Türkçe-bilinçli küçük harf — ICU'ya BAĞIMLI DEĞİL (CLAUDE.md 7.5, kural 4).
//
// NEDEN: JavaScript'in `toLocaleLowerCase('tr-TR')`'i tarayıcıda doğru çalışır ama
// React Native'in motoru Hermes tam ICU içermeyebilir; o zaman 'tr-TR' locale'i
// SESSİZCE yok sayılır ve İngilizce kuralları uygulanır:
//   "I".toLowerCase()  -> "i"   (YANLIŞ — Türkçe'de "ı" olmalı)
//   "İ".toLowerCase()  -> "i̇"  (YANLIŞ — i + birleşik nokta)
// Bu, sözlük aramasını ve akıllı dağıtıcının harf-sayım imzalarını bozar
// (dokümanın "sessiz hata #1"i). Bu yüzden küçültmeyi açık, deterministik bir
// eşlemeyle yapıyoruz — hem web'de hem mobilde aynı, doğru sonuç.
//
// Sadece KÜÇÜLTME yapar (engine'in ihtiyacı bu: kartlar BÜYÜK harf, sözlük küçük).

const TR_LOWER_MAP = {
  "İ": "i", // U+0130 noktalı büyük I -> i
  "I": "ı", // U+0049 büyük I        -> ı (noktasız)
  // Aşağıdakileri JS de doğru yapar; netlik/dokümantasyon için açıkça eşliyoruz.
  "Ç": "ç",
  "Ş": "ş",
  "Ğ": "ğ",
  "Ü": "ü",
  "Ö": "ö",
};

// Bir string'i Türkçe-doğru küçük harfe çevirir. Kod-noktası bazında (for...of).
export function trLower(str) {
  let out = "";
  for (const ch of str) {
    out += TR_LOWER_MAP[ch] ?? ch.toLowerCase();
  }
  return out;
}
