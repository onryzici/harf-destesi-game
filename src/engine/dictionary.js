// Türkçe sözlük yükleme + kelime doğrulama — CLAUDE.md 7.5.
// KRİTİK: Türkçe büyük/küçük harf için trLower (ICU'suz, Hermes-güvenli — kural 4).

import { trLower } from "./turkishCase.js";

let WORDS = null; // yüklenen kelimeler (Set) — O(1) kontrol

// Kelimeyi doğrulama için normalize eder (Türkçe-bilinçli küçük harf).
export function normalizeWord(word) {
  return trLower(word.trim());
}

// Ham metinden (her satır bir kelime) Set kurar. Platform-bağımsız: web fetch
// sonrası, React Native ise dosyayı okuduktan sonra bunu çağırır.
// Döndürür: yüklenen kelime sayısı.
export function loadDictionaryFromText(text) {
  WORDS = new Set();
  for (const line of text.split("\n")) {
    const w = normalizeWord(line);
    if (w.length > 0) WORDS.add(w);
  }
  return WORDS.size;
}

// Sözlüğü bir URL'den yükler (web). RN, fetch yerine loadDictionaryFromText
// kullanır — bu fonksiyon mobilde hiç çağrılmaz (Hermes fetch'e dokunmaz).
export async function loadDictionary(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Sözlük yüklenemedi (${res.status}): ${url}`);
  }
  return loadDictionaryFromText(await res.text());
}

// Sözlük yüklendi mi?
export function isDictionaryLoaded() {
  return WORDS !== null;
}

// Yüklenen kelime Set'ini döndürür (akıllı dağıtıcı kullanır).
export function getWordSet() {
  if (WORDS === null) throw new Error("Sözlük henüz yüklenmedi.");
  return WORDS;
}

// Kelime geçerli mi? (en az minLen harf ve sözlükte var)
export function isValidWord(word, minLen = 2) {
  if (WORDS === null) throw new Error("Sözlük henüz yüklenmedi.");
  const w = normalizeWord(word);
  return w.length >= minLen && WORDS.has(w);
}
