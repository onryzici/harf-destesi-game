// Joker rafı — gerçek joker kartları, ipucu (tooltip), tetikleme parıltısı.
// Sadece DOM; state OKUR. (Aşama 3)

import { RARITY_COLORS } from "../data/jokers.js";

const SLOTS = 5;

// firedIds: bu skorlamada tetiklenen joker id'leri (parıltı için).
export function renderJokers(container, state, firedIds = []) {
  const fired = new Set(firedIds);
  const jokers = state.run.jokers;
  let html = "";

  for (let i = 0; i < SLOTS; i++) {
    const j = jokers[i];
    if (!j) {
      html += `<div class="joker joker--empty"></div>`;
      continue;
    }
    const color = RARITY_COLORS[j.rarity] || "#888";
    const fireCls = fired.has(j.id) ? " joker--fired" : "";
    html += `
      <div class="joker${fireCls}" data-jid="${j.id}" draggable="true" style="--rar:${color}">
        <div class="joker__top">JOKER</div>
        <div class="joker__icon">${j.icon || "🃏"}</div>
        <div class="joker__name">${j.name}</div>
        <div class="joker__tip"><b>${j.name}</b><span>${j.description}</span></div>
      </div>`;
  }
  container.innerHTML = html;
}
