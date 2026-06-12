// Dükkân görseli — körler arası satın alma ekranı. Sadece DOM; state OKUR.
// Tıklamalar main.js'te delege edilir (data-* öznitelikleri).

import { RARITY_COLORS } from "../data/jokers.js";
import { letterChips } from "../data/letterValues.js";

function jokerOffer(j, money) {
  const color = RARITY_COLORS[j.rarity] || "#888";
  const afford = money >= j.cost;
  return `
    <div class="shop-card" style="--rar:${color}">
      <div class="shop-card__price">$${j.cost}</div>
      <div class="shop-card__icon">${j.icon || "🃏"}</div>
      <div class="shop-card__name">${j.name}</div>
      <div class="shop-card__desc">${j.description}</div>
      <button class="btn-mini shop-buy" data-buy="${j.id}" ${afford ? "" : "disabled"}>
        Satın Al
      </button>
    </div>`;
}

function boosterCard(booster, money) {
  const afford = money >= booster.cost && !booster.used;
  return `
    <div class="shop-card shop-card--pack" style="--rar:#7d5fff">
      <div class="shop-card__price">$${booster.cost}</div>
      <div class="shop-card__icon">📦</div>
      <div class="shop-card__name">${booster.name}</div>
      <div class="shop-card__desc">3 harf arasından birini seç, desteye kat.</div>
      <button class="btn-mini shop-buy" data-act="booster" ${afford ? "" : "disabled"}>
        ${booster.used ? "Açıldı" : "Aç"}
      </button>
    </div>`;
}

function voucherCard(v, money) {
  const afford = money >= v.cost;
  return `
    <div class="shop-card shop-card--pack" style="--rar:#ffcb45">
      <div class="shop-card__price">$${v.cost}</div>
      <div class="shop-card__icon">${v.icon || "🎟️"}</div>
      <div class="shop-card__name">${v.name}</div>
      <div class="shop-card__desc">${v.description}</div>
      <button class="btn-mini shop-buy" data-act="voucher" ${afford ? "" : "disabled"}>
        Satın Al
      </button>
    </div>`;
}

function ownedJoker(j) {
  const color = RARITY_COLORS[j.rarity] || "#888";
  const value = Math.max(1, Math.floor(j.cost / 2));
  return `
    <div class="shop-card shop-card--own" style="--rar:${color}">
      <div class="shop-card__icon">${j.icon || "🃏"}</div>
      <div class="shop-card__name">${j.name}</div>
      <div class="shop-card__desc">${j.description}</div>
      <button class="btn-mini shop-sell" data-sell="${j.id}">Sat $${value}</button>
    </div>`;
}

function boosterPick(choices) {
  return `
    <div class="shop__head"><h2>Harf Paketi — bir harf seç</h2></div>
    <div class="shop__pick">
      ${choices
        .map(
          (ch) => `
        <button class="tile" data-letter="${ch}" type="button">
          <span class="tile__char">${ch}</span>
          <span class="tile__chips">${letterChips(ch)}</span>
        </button>`
        )
        .join("")}
    </div>`;
}

export function renderShop(panelEl, state, message = "") {
  // Harf paketi açıksa seçim ekranını göster.
  if (state.run.boosterChoices) {
    panelEl.innerHTML = boosterPick(state.run.boosterChoices);
    return;
  }

  const shop = state.run.shop;
  const money = state.run.money;

  panelEl.innerHTML = `
    <div class="shop__head">
      <h2>DÜKKÂN</h2>
      <div class="shop__money">$${money}</div>
      <button class="btn btn--play" data-act="next" type="button">Sonraki Tur →</button>
    </div>
    <div class="shop__msg">${message}</div>

    <div class="shop__section">
      <button class="btn-mini shop-reroll" data-act="reroll" type="button"
              ${money >= shop.rerollCost ? "" : "disabled"}>Yenile $${shop.rerollCost}</button>
      <div class="shop__offers">
        ${shop.jokers.map((j) => jokerOffer(j, money)).join("") || '<div class="shop__empty">Joker kalmadı</div>'}
      </div>
    </div>

    <div class="shop__section shop__packs">
      ${boosterCard(shop.booster, money)}
      ${shop.voucher ? voucherCard(shop.voucher, money) : ""}
    </div>

    <div class="shop__owned">
      <div class="shop__owned-label">Jokerlerin (${state.run.jokers.length}/5) — sürükleyerek sırala, sat:</div>
      <div class="shop__offers">
        ${state.run.jokers.map((j) => ownedJoker(j)).join("") || '<div class="shop__empty">Henüz joker yok</div>'}
      </div>
    </div>`;
}
