// Orchestrator — main.js'in muadili: KULLANICI GİRİŞİ → ENGINE → (bump) RENDER.
// Saf engine fonksiyonlarını çağırır, sonra store'u bump'lar. DOM yok; React'e
// özgü hiçbir şey engine'e sızmaz (CLAUDE.md 7.2).

import {
  createState,
  startRun,
  playWord,
  discardCards,
  collectBlindReward,
  proceedToNextBlind,
  scoreWord,
  isValidWord,
} from "./engineApi";
import { useGameStore } from "./store";
import { haptic } from "./juice";
import type { Card } from "../types/engine";

const store = useGameStore;
let playSeq = 0; // her oynamada artar → FX yeniden tetiklenir

// Hata/uyarı mesajları (main.js REASON ile aynı).
const REASON: Record<string, string> = {
  kısa: "En az 2 harf gerek.",
  gecersiz: "Bu kelime sözlükte yok.",
  hakYok: "Kelime hakkın bitti.",
  atmaYok: "Değişim hakkın bitti.",
  seçimYok: "Önce harf seç.",
  bitti: "Tur bitti.",
  // Patron kısıtlamaları
  uzunYol: "Patron: kelime en az 5 harf olmalı.",
  tekel: "Patron: aynı harfi 2'den fazla kullanamazsın.",
  sansur: "Patron: kilitli harf kullandın.",
};

// Dizilen id'lerden kart objelerini (sırayla) çıkar.
function stagedCards(): Card[] {
  const { state, ui } = store.getState();
  if (!state) return [];
  const byId = new Map(state.round.hand.map((c) => [c.id, c]));
  return ui.word.map((id) => byId.get(id)).filter((c): c is Card => !!c);
}

// Canlı önizleme: dizilen kelimenin taban skoru (rastgele jokerler pas geçer).
function updatePreview() {
  const { state, ui, setUi } = store.getState();
  if (!state) return;
  const cards = stagedCards();
  if (cards.length === 0) {
    setUi({ preview: null });
    return;
  }
  const sc = scoreWord(state, cards, { preview: true });
  const word = cards.map((c) => c.char).join("");
  setUi({
    preview: { chips: sc.chips, mult: sc.mult, score: sc.score, word, valid: isValidWord(word, state.config.minWordLength) },
  });
}

// ── Yeni run ──
export function newRun() {
  const seed = "run-" + Math.floor(Date.now());
  const state = createState(seed);
  startRun(state);
  store.getState().setGame(state);
  store.setState({
    started: true,
    screen: "game",
    animating: false,
    ui: { word: [], message: "Harfe dokun, kelimeyi kur, OYNA. Turu geç → devam.", preview: null, firedJokers: [], lastPlay: null },
  });
  store.getState().bump();
}

// ── Kelime kurma (tap-to-build) ──
export function placeTile(id: number) {
  const { ui, setUi, animating } = store.getState();
  if (animating) return;
  if (ui.word.includes(id)) return;
  haptic.pick();
  setUi({ word: [...ui.word, id], message: "" });
  updatePreview();
  store.getState().bump();
}

export function removeTile(id: number) {
  const { ui, setUi, animating } = store.getState();
  if (animating) return;
  haptic.tap();
  setUi({ word: ui.word.filter((w) => w !== id) });
  updatePreview();
  store.getState().bump();
}

export function clearWord() {
  const { setUi, animating } = store.getState();
  if (animating) return;
  setUi({ word: [], preview: null, message: "" });
  store.getState().bump();
}

// ── OYNA ──
// Faz A: juice yok — engine puanlar, skor doğrudan eklenir. (Sıralı çözüm Faz C.)
// Döndürür: oynandı mı (UI tur-sonu overlay'ini buna göre tetikler).
export function play(): boolean {
  const { state, ui, setUi, animating } = store.getState();
  if (!state || animating) return false;
  const res = playWord(state, ui.word);
  if (!res.ok) {
    haptic.error();
    setUi({ message: REASON[res.reason ?? ""] ?? "Oynanamaz." });
    store.getState().bump();
    return false;
  }
  // Coşku (hype): skor hedefe ne kadar yakın → 0..3 (sarsıntı/parçacık ölçeği).
  const ratio = state.round.target > 0 ? (res.score ?? 0) / state.round.target : 0;
  const hype = ratio >= 1 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.2 ? 1 : 0;
  if (hype >= 2) haptic.big();
  else haptic.play();
  setUi({
    word: [],
    preview: null,
    firedJokers: res.firedJokers ?? [],
    message: `${res.word}: +${res.score}`,
    lastPlay: { score: res.score ?? 0, chips: res.chips ?? 0, mult: res.mult ?? 0, hype, seq: ++playSeq },
  });
  store.getState().bump();
  return true;
}

// ── DEĞİŞTİR (discard) ──
export function discard() {
  const { state, ui, setUi, animating } = store.getState();
  if (!state || animating) return;
  const res = discardCards(state, ui.word);
  if (!res.ok) {
    haptic.error();
    setUi({ message: REASON[res.reason ?? ""] ?? "Atılamaz." });
    store.getState().bump();
    return;
  }
  haptic.tap();
  setUi({ word: [], preview: null, message: "Harfler değişti." });
  updatePreview();
  store.getState().bump();
}

// Tur kazanınca ödülü topla (bir kez, idempotent) — overlay'de gösterilir.
export function collectRewardNow() {
  const { state } = store.getState();
  if (!state) return null;
  const r = collectBlindReward(state);
  store.getState().bump();
  return r;
}

// ── Tur kazanınca devam (Faz A: dükkânsız; dükkân Faz B'de araya girer) ──
// Döndürür: { runWon } — true ise tüm bölümler bitti.
export function proceedAfterWin(): { runWon: boolean } {
  const { state } = store.getState();
  if (!state) return { runWon: false };
  collectBlindReward(state); // parayı topla (bir kez)
  const res = proceedToNextBlind(state);
  if (!res.runWon) {
    const boss = state.round.boss;
    store.getState().setUi({
      word: [],
      preview: null,
      firedJokers: [],
      message: boss ? `⚠ PATRON — ${boss.name}: ${boss.description}` : "Yeni tur! Harfleri diz, OYNA.",
    });
  }
  store.getState().bump();
  return res;
}
