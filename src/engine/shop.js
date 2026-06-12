// Dükkân — CLAUDE.md 3.5. Saf mantık, DOM yok. Aşama 4.
// Para ile joker al, sat, reroll, harf paketi (booster), kupon (voucher).
// Tüm rastgelelik seed'li rng'den (state.run.rng).

import { JOKERS } from "../data/jokers.js";
import { VOUCHERS } from "../data/vouchers.js";
import { MAX_JOKERS } from "./jokerActions.js";

const SHOP_JOKER_COUNT = 2;
const REROLL_BASE = 5;
const BOOSTER_COST = 4;
const BOOSTER_OPTIONS = 3;

// Harf paketi havuzu — sesli ağırlıklı (oynanabilirliği artırır).
const BOOSTER_LETTERS = ["A", "E", "İ", "I", "O", "U", "K", "L", "N", "R", "T", "M", "S", "B", "D", "Y"];

// Diziden rng ile n adet (tekrarsız) seç.
function pickN(arr, n, rng) {
  const pool = [...arr];
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

// Körler arası dükkânı üretir (state.run.shop'a yazar).
export function generateShop(state) {
  const rng = state.run.rng;
  const ownedJ = new Set(state.run.jokers.map((j) => j.id));
  const ownedV = new Set(state.run.vouchers.map((v) => v.id));
  const availV = VOUCHERS.filter((v) => !ownedV.has(v.id));

  state.run.shop = {
    jokers: pickN(JOKERS.filter((j) => !ownedJ.has(j.id)), SHOP_JOKER_COUNT, rng),
    booster: { id: "harf-paketi", name: "Harf Paketi", cost: BOOSTER_COST, used: false },
    voucher: availV.length ? pickN(availV, 1, rng)[0] : null,
    rerollCost: REROLL_BASE,
  };
  state.run.boosterChoices = null;
  return state.run.shop;
}

// Dükkân stoğunu (jokerleri) parayla yenile.
export function reroll(state) {
  const shop = state.run.shop;
  if (!shop || state.run.money < shop.rerollCost) return { ok: false };
  state.run.money -= shop.rerollCost;
  const ownedJ = new Set(state.run.jokers.map((j) => j.id));
  shop.jokers = pickN(JOKERS.filter((j) => !ownedJ.has(j.id)), SHOP_JOKER_COUNT, state.run.rng);
  shop.rerollCost += 1;
  return { ok: true };
}

export function buyJoker(state, jokerId) {
  const shop = state.run.shop;
  const idx = shop?.jokers.findIndex((j) => j.id === jokerId);
  if (idx == null || idx === -1) return { ok: false, reason: "yok" };
  const joker = shop.jokers[idx];
  if (state.run.jokers.length >= MAX_JOKERS) return { ok: false, reason: "slotDolu" };
  if (state.run.money < joker.cost) return { ok: false, reason: "para" };
  state.run.money -= joker.cost;
  state.run.jokers.push(joker);
  shop.jokers.splice(idx, 1);
  return { ok: true, joker };
}

// Joker sat — maliyetin yarısı (en az 1).
export function sellJoker(state, jokerId) {
  const i = state.run.jokers.findIndex((j) => j.id === jokerId);
  if (i === -1) return { ok: false };
  const joker = state.run.jokers[i];
  const value = Math.max(1, Math.floor(joker.cost / 2));
  state.run.jokers.splice(i, 1);
  state.run.money += value;
  return { ok: true, value };
}

// Harf paketini satın al → 3 harf seçeneği üret (oyuncu birini seçer).
export function buyBooster(state) {
  const shop = state.run.shop;
  if (!shop || shop.booster.used) return { ok: false, reason: "yok" };
  if (state.run.money < shop.booster.cost) return { ok: false, reason: "para" };
  state.run.money -= shop.booster.cost;
  shop.booster.used = true;
  state.run.boosterChoices = pickN(BOOSTER_LETTERS, BOOSTER_OPTIONS, state.run.rng);
  return { ok: true, choices: state.run.boosterChoices };
}

// Paketten bir harf seç → desteye kalıcı ekle.
export function chooseBoosterLetter(state, char) {
  if (!state.run.boosterChoices?.includes(char)) return { ok: false };
  state.run.deck.push({ id: state.run.nextCardId++, char, enhancements: [] });
  state.run.deckSize = state.run.deck.length;
  state.run.boosterChoices = null;
  return { ok: true };
}

export function buyVoucher(state) {
  const shop = state.run.shop;
  if (!shop?.voucher) return { ok: false, reason: "yok" };
  if (state.run.money < shop.voucher.cost) return { ok: false, reason: "para" };
  const v = shop.voucher;
  state.run.money -= v.cost;
  state.run.vouchers.push(v);
  v.apply(state); // kalıcı etki (config)
  shop.voucher = null;
  return { ok: true, voucher: v };
}
