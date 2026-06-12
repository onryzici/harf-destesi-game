// main.js — KULLANICI GİRİŞİ → ENGINE → RENDER (CLAUDE.md 7.2).
// Sürükle-bırak, canlı önizleme, jokerler, desteden geliş animasyonu, juice.

import { CONFIG } from "./data/config.js";
import { createState } from "./engine/state.js";
import { startRun, playWord, discardCards, collectBlindReward, proceedToNextBlind } from "./engine/round.js";
import { scoreWord } from "./engine/scoring.js";
import { loadDictionary, isValidWord } from "./engine/dictionary.js";
import { moveJoker } from "./engine/jokerActions.js";
import * as shop from "./engine/shop.js";
import { renderSidebar } from "./render/renderSidebar.js";
import { renderHand } from "./render/renderHand.js";
import { renderBoard } from "./render/renderBoard.js";
import { renderJokers } from "./render/renderJokers.js";
import { renderDeck } from "./render/renderDeck.js";
import { renderShop } from "./render/renderShop.js";
import { countUp, shake } from "./render/animations.js";
import { playScoreSequence } from "./render/scoreSequence.js";

const $ = (id) => document.getElementById(id);
const feltEl = $("felt");
const handEl = $("hand");
const boardEl = $("board");
const boardSlotsEl = $("board-slots");
const boardHintEl = $("board-hint");
const jokerShelfEl = $("joker-shelf");
const jokerCountEl = $("joker-count");
const shopOverlayEl = $("shop");
const shopPanelEl = $("shop-panel");
const playBtn = $("play-btn");
const discardBtn = $("discard-btn");
const clearBtn = $("clear-btn");
const overlayEl = $("overlay");
const overlayTitleEl = $("overlay-title");
const overlayTextEl = $("overlay-text");
const overlayBtnEl = $("overlay-btn");
const overlayStatsEl = $("overlay-stats");
const fxLayerEl = $("fx-layer");

// Menü / ayarlar / nasıl oynanır ekranları
const menuEl = $("menu");
const howtoEl = $("howto");
const settingsEl = $("settings");
const openMenuBtn = $("open-menu");

const sidebarEls = {
  blindName: $("blind-name"), blindReq: $("blind-req"), roundScore: $("round-score"),
  tierLabel: $("tier-label"), tierBox: $("tier-box"), chips: $("chips"), mult: $("mult"),
  plays: $("plays"), discards: $("discards"), money: $("money"),
  ante: $("ante"), roundNum: $("round-num"), message: $("message"),
  bossInfo: $("boss-info"),
};
const deckEls = { count: $("deck-count") };

let state = null;
const ui = { word: [], message: "", preview: null, firedJokers: [] };
let drag = { id: null, from: null };
let jdrag = { id: null };
let animating = false; // sıralı skor çözümü sürerken girişleri kilitle
let lastHandIds = new Set(); // desteden geliş animasyonu için
let gameStarted = false; // ana menü "OYNA" mı "DEVAM ET" mi göstersin

// ── Ayarlar (kalıcı: localStorage) ──
const DEFAULT_SETTINGS = { speed: 1, shake: true, particles: true };
let settings = loadSettings();
function loadSettings() {
  try {
    const raw = localStorage.getItem("wordtro-settings");
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings() {
  try { localStorage.setItem("wordtro-settings", JSON.stringify(settings)); } catch {}
}
// Sarsıntıyı ayara göre uygula.
function maybeShake(el, big = false) { if (settings.shake) shake(el, big); }

const REASON = {
  kısa: "En az 2 harf gerek.",
  gecersiz: "Bu kelime sözlükte yok.",
  hakYok: "Kelime hakkın bitti.",
  atmaYok: "Değişim hakkın bitti.",
  seçimYok: "Önce harf seç.",
  // Patron kısıtlamaları
  uzunYol: "Patron: kelime en az 5 harf olmalı.",
  tekel: "Patron: aynı harfi 2'den fazla kullanamazsın.",
  sansur: "Patron: kilitli harf kullandın.",
};

// ── Önizleme + render ──
function stagedCards() {
  const byId = new Map(state.round.hand.map((c) => [c.id, c]));
  return ui.word.map((id) => byId.get(id)).filter(Boolean);
}

function updatePreview() {
  const cards = stagedCards();
  if (cards.length === 0) { ui.preview = null; return; }
  const sc = scoreWord(state, cards, { preview: true }); // rastgele jokerler pas
  const word = cards.map((c) => c.char).join("");
  ui.preview = { ...sc, word, valid: isValidWord(word, state.config.minWordLength) };
}

function renderAll() {
  // Yeni gelen kartları tespit et (deal-in animasyonu)
  const justDealt = new Set();
  for (const c of state.round.hand) if (!lastHandIds.has(c.id)) justDealt.add(c.id);

  renderSidebar(sidebarEls, state, ui);
  renderJokers(jokerShelfEl, state, ui.firedJokers);
  renderDeck(deckEls, state);
  renderBoard(boardSlotsEl, boardHintEl, state, ui);
  renderHand(handEl, state, ui, justDealt);

  jokerCountEl.textContent = `${state.run.jokers.length}/5`;
  // Geçerli kelime dizildiyse alanı yeşil parıltıyla "hazır" göster
  boardEl.classList.toggle("play-area--ready", !!(ui.preview && ui.preview.valid));

  lastHandIds = new Set(state.round.hand.map((c) => c.id));

  const over = state.round.status !== "playing";
  playBtn.disabled = over;
  discardBtn.disabled = over;
}

function afterChange() {
  updatePreview();
  renderAll();
}

// ── Sürükle-bırak: harfler ──
function onDragStart(e) {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  drag.id = Number(tile.dataset.id);
  drag.from = tile.dataset.from;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(drag.id));
  tile.classList.add("dragging");
}
function onDragEnd(e) {
  const tile = e.target.closest(".tile");
  if (tile) tile.classList.remove("dragging");
  boardEl.classList.remove("drop-hover");
}
function insertIndexFromX(x) {
  const tiles = [...boardSlotsEl.querySelectorAll(".tile")];
  for (let i = 0; i < tiles.length; i++) {
    const r = tiles[i].getBoundingClientRect();
    if (x < r.left + r.width / 2) return i;
  }
  return tiles.length;
}
function placeOnBoard(id, idx) {
  const cur = ui.word.indexOf(id);
  if (cur !== -1) { ui.word.splice(cur, 1); if (cur < idx) idx--; }
  ui.word.splice(idx, 0, id);
  ui.message = "";
  afterChange();
}
function removeFromBoard(id) {
  const i = ui.word.indexOf(id);
  if (i !== -1) { ui.word.splice(i, 1); afterChange(); }
}

[handEl, boardSlotsEl].forEach((el) => {
  el.addEventListener("dragstart", onDragStart);
  el.addEventListener("dragend", onDragEnd);
});
boardEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  boardEl.classList.add("drop-hover");
});
boardEl.addEventListener("dragleave", (e) => {
  if (!boardEl.contains(e.relatedTarget)) boardEl.classList.remove("drop-hover");
});
boardEl.addEventListener("drop", (e) => {
  e.preventDefault();
  boardEl.classList.remove("drop-hover");
  if (drag.id != null) placeOnBoard(drag.id, insertIndexFromX(e.clientX));
  drag.id = null;
});
handEl.addEventListener("dragover", (e) => e.preventDefault());
handEl.addEventListener("drop", (e) => {
  e.preventDefault();
  if (drag.id != null && drag.from === "board") removeFromBoard(drag.id);
  drag.id = null;
});

// Tıklama (hızlı yol)
handEl.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (!tile) return;
  const id = Number(tile.dataset.id);
  if (!ui.word.includes(id)) { ui.word.push(id); afterChange(); }
});
boardSlotsEl.addEventListener("click", (e) => {
  const tile = e.target.closest(".tile");
  if (tile) removeFromBoard(Number(tile.dataset.id));
});

// ── Jokerler: tıkla=sat/çıkar, sürükle=yeniden sırala (CLAUDE.md 4.1) ──
jokerShelfEl.addEventListener("dragstart", (e) => {
  const j = e.target.closest(".joker[data-jid]");
  if (!j) return;
  jdrag.id = j.dataset.jid;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", jdrag.id);
});
jokerShelfEl.addEventListener("dragover", (e) => e.preventDefault());
jokerShelfEl.addEventListener("drop", (e) => {
  e.preventDefault();
  if (jdrag.id == null) return;
  const jokers = [...jokerShelfEl.querySelectorAll(".joker[data-jid]")];
  let idx = jokers.length;
  for (let i = 0; i < jokers.length; i++) {
    const r = jokers[i].getBoundingClientRect();
    if (e.clientX < r.left + r.width / 2) { idx = i; break; }
  }
  moveJoker(state, jdrag.id, idx);
  jdrag.id = null;
  afterChange();
});
// ── Dükkân ──
function openShop() {
  renderShop(shopPanelEl, state, "");
  shopOverlayEl.classList.add("overlay--show");
}
function closeShop() {
  shopOverlayEl.classList.remove("overlay--show");
}
function refreshShop(msg = "") {
  renderShop(shopPanelEl, state, msg);
  renderAll(); // arkadaki HUD (para, jokerler) da güncellensin
}

shopPanelEl.addEventListener("click", (e) => {
  const t = e.target.closest("[data-act],[data-buy],[data-sell],[data-letter]");
  if (!t) return;

  if (t.dataset.letter) {
    shop.chooseBoosterLetter(state, t.dataset.letter);
    refreshShop("Harf desteye eklendi.");
    return;
  }
  if (t.dataset.buy) {
    const r = shop.buyJoker(state, t.dataset.buy);
    refreshShop(r.ok ? `Alındı: ${r.joker.name}` :
      r.reason === "slotDolu" ? "Joker yuvası dolu (max 5)." : "Yetersiz para.");
    return;
  }
  if (t.dataset.sell) {
    const r = shop.sellJoker(state, t.dataset.sell);
    refreshShop(r.ok ? `Satıldı: +$${r.value}` : "");
    return;
  }
  const act = t.dataset.act;
  if (act === "reroll") {
    const r = shop.reroll(state);
    refreshShop(r.ok ? "Dükkân yenilendi." : "Yetersiz para.");
  } else if (act === "booster") {
    const r = shop.buyBooster(state);
    refreshShop(r.ok ? "" : "Yetersiz para.");
  } else if (act === "voucher") {
    const r = shop.buyVoucher(state);
    refreshShop(r.ok ? `Kupon alındı: ${r.voucher.name}` : "Yetersiz para.");
  } else if (act === "next") {
    const res = proceedToNextBlind(state);
    closeShop();
    if (res.runWon) return showRunWon();
    ui.word = []; ui.preview = null;
    ui.message = state.round.boss
      ? `⚠ PATRON — ${state.round.boss.name}: ${state.round.boss.description}`
      : "Yeni tur! Harfleri diz, OYNA.";
    lastHandIds = new Set();
    renderAll();
  }
});

// ── Aksiyonlar ──
playBtn.addEventListener("click", async () => {
  if (animating) return;
  const prev = state.round.score;
  // Önce sözlük/hak kontrolü için önizleme amaçlı sonuç hesabı engine'de yapılır.
  const res = playWord(state, ui.word);
  if (!res.ok) {
    ui.message = REASON[res.reason] ?? "Oynanamaz.";
    renderAll();
    maybeShake(boardEl);
    return;
  }

  // Tahtadaki kelimeyi EKRANDA TUT — skoru adım adım üstünde çözeceğiz.
  // (Engine state'i zaten güncelledi; render'ı animasyondan SONRA yapacağız.)
  animating = true;
  playBtn.disabled = discardBtn.disabled = clearBtn.disabled = true;

  const { hype } = await playScoreSequence({
    timeline: res.timeline,
    result: res,
    target: state.round.target,
    chipsEl: sidebarEls.chips,
    multEl: sidebarEls.mult,
    boardSlotsEl,
    jokerShelfEl,
    feltEl,
    fxLayer: fxLayerEl,
    speed: settings.speed,
    particles: settings.particles,
  });

  // Skoru kör skoruna say + ekran sarsıntısı (hype ölçeğinde)
  sidebarEls.roundScore.textContent = prev;
  countUp(sidebarEls.roundScore, prev, state.round.score, 600 / settings.speed);
  maybeShake(feltEl, hype >= 2);

  // Tahtayı temizle, eli yeniden çek (yeni kartlar deal-in ile gelir)
  animating = false;
  ui.word = []; ui.preview = null; ui.message = ""; ui.firedJokers = [];
  renderAll();
  maybeEndRound();
});

discardBtn.addEventListener("click", () => {
  if (animating) return;
  const res = discardCards(state, ui.word);
  if (!res.ok) { ui.message = REASON[res.reason] ?? "Atılamaz."; renderAll(); return; }
  ui.word = []; ui.preview = null; ui.message = "Harfler değişti.";
  afterChange();
});

clearBtn.addEventListener("click", () => {
  if (animating) return;
  ui.word = []; ui.preview = null; ui.message = "";
  afterChange();
});

// ── Tur/run sonu ──
function maybeEndRound() {
  if (state.round.status === "playing") return;
  setTimeout(() => showOverlay(state.round.status), 760);
}
function showOverlay(kind) {
  if (kind === "won") {
    const blind = state.round.blind;
    const reward = collectBlindReward(state); // parayı topla
    overlayTitleEl.textContent = "Tur Geçildi!";
    overlayTextEl.textContent = reward
      ? `${blind.name}: ${state.round.score}/${state.round.target} · Ödül +$${reward.total} (taban ${reward.base} + hak ${reward.leftover} + faiz ${reward.interest})`
      : `${blind.name}: ${state.round.score}/${state.round.target}`;
    overlayBtnEl.textContent = "Dükkâna Git →";
    overlayBtnEl.onclick = () => {
      hideOverlay();
      shop.generateShop(state);
      openShop();
    };
    overlayStatsEl.hidden = true; // tur galibiyetinde özet yok (sadece ödül)
  } else {
    overlayTitleEl.textContent = "Oyun Bitti";
    overlayTextEl.textContent = `Hedefe ulaşamadın: ${state.round.score} / ${state.round.target}`;
    overlayBtnEl.textContent = "Yeniden Oyna";
    overlayBtnEl.onclick = () => { hideOverlay(); newRun(); };
    fillRunStats();
  }
  overlayEl.classList.add("overlay--show");
}
function showRunWon() {
  overlayTitleEl.textContent = "KAZANDIN!";
  overlayTextEl.textContent = "Tüm bölümleri geçtin. Efsane.";
  overlayBtnEl.textContent = "Yeni Oyun";
  overlayBtnEl.onclick = () => { hideOverlay(); newRun(); };
  fillRunStats();
  overlayEl.classList.add("overlay--show");
}
// Run özetini (kazanma/kaybetme ekranı) doldurur.
function fillRunStats() {
  const s = state.run.stats;
  const best = s.bestWord
    ? `${s.bestWord.toLocaleLowerCase("tr-TR")} · ${s.bestScore}`
    : "—";
  overlayStatsEl.innerHTML =
    `<div class="run-stats__row"><span>Ulaşılan Bölüm</span><strong>${state.run.ante}/${state.config.maxAnte}</strong></div>` +
    `<div class="run-stats__row"><span>En iyi kelime</span><strong>${best}</strong></div>` +
    `<div class="run-stats__row"><span>Oynanan kelime</span><strong>${s.words}</strong></div>` +
    `<div class="run-stats__row"><span>Kalan para</span><strong>$${state.run.money}</strong></div>`;
  overlayStatsEl.hidden = false;
}
function hideOverlay() { overlayEl.classList.remove("overlay--show"); }

// ── Menü / Nasıl oynanır / Ayarlar ──
const menuPlayBtn = $("menu-play");
const menuNewBtn = $("menu-newgame");

function openMenu() {
  // Oyun başladıysa "DEVAM ET" + "YENİ OYUN", yoksa sadece "OYNA".
  menuPlayBtn.textContent = gameStarted ? "DEVAM ET" : "OYNA";
  menuNewBtn.style.display = gameStarted ? "" : "none";
  menuEl.classList.add("overlay--show");
}
function closeMenu() { menuEl.classList.remove("overlay--show"); }

menuPlayBtn.addEventListener("click", () => {
  if (!gameStarted) { gameStarted = true; newRun(); }
  closeMenu();
});
menuNewBtn.addEventListener("click", () => {
  hideOverlay(); closeShop(); newRun(); closeMenu();
});
$("menu-howto").addEventListener("click", () => howtoEl.classList.add("overlay--show"));
$("menu-settings").addEventListener("click", () => settingsEl.classList.add("overlay--show"));
$("howto-close").addEventListener("click", () => howtoEl.classList.remove("overlay--show"));
$("settings-close").addEventListener("click", () => settingsEl.classList.remove("overlay--show"));
openMenuBtn.addEventListener("click", openMenu);

// Ayar kontrollerini başlangıç değerleriyle çiz + olayları bağla.
function syncSettingsUI() {
  for (const b of settingsEl.querySelectorAll("#set-speed button"))
    b.classList.toggle("seg--on", Number(b.dataset.speed) === settings.speed);
  $("set-shake").classList.toggle("toggle--on", settings.shake);
  $("set-particles").classList.toggle("toggle--on", settings.particles);
}
$("set-speed").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-speed]");
  if (!b) return;
  settings.speed = Number(b.dataset.speed);
  saveSettings(); syncSettingsUI();
});
$("set-shake").addEventListener("click", () => {
  settings.shake = !settings.shake; saveSettings(); syncSettingsUI();
});
$("set-particles").addEventListener("click", () => {
  settings.particles = !settings.particles; saveSettings(); syncSettingsUI();
});

// ── Başlatma ──
function newRun() {
  const seed = "run-" + Math.floor(performance.now());
  state = createState(seed);
  startRun(state);
  // Jokersiz başla (roguelike). İlk turu geç, dükkândan joker al.
  ui.word = []; ui.preview = null; ui.firedJokers = [];
  ui.message = "Harfleri alana sürükle, kelimeyi kur, OYNA. Turu geç → dükkân.";
  lastHandIds = new Set();
  renderAll();
}

async function boot() {
  syncSettingsUI();
  // Menü açıkken sözlük arkada yüklenir; hazır olana dek OYNA kilitli.
  menuPlayBtn.disabled = true;
  menuPlayBtn.textContent = "Yükleniyor…";
  sidebarEls.message.textContent = "Sözlük yükleniyor…";
  try {
    const count = await loadDictionary(CONFIG.dictionaryUrl);
    console.log(`Sözlük yüklendi: ${count} kelime`);
    menuPlayBtn.disabled = false;
    menuPlayBtn.textContent = "OYNA";
    sidebarEls.message.textContent = "";
  } catch (err) {
    console.error(err);
    menuPlayBtn.textContent = "Sözlük yüklenemedi";
    sidebarEls.message.textContent =
      "Sözlük yüklenemedi. Yerel sunucu gerekli: 'python3 -m http.server', sonra http://localhost:8000";
  }
}

boot();
