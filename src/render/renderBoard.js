// Kelime kurma alanı (drop zone) — dizilen harfler. Sadece DOM; state OKUR.
// ui.word: alana sürüklenmiş kart id'leri (sıralı).

import { letterChips } from "../data/letterValues.js";

export function renderBoard(slotsEl, hintEl, state, ui) {
  const byId = new Map(state.round.hand.map((c) => [c.id, c]));
  const cards = ui.word.map((id) => byId.get(id)).filter(Boolean);

  hintEl.style.display = cards.length === 0 ? "block" : "none";

  slotsEl.innerHTML = cards
    .map(
      (card) => `
        <button class="tile tile--board" draggable="true" data-id="${card.id}" data-from="board" type="button">
          <span class="tile__char">${card.char}</span>
          <span class="tile__chips">${letterChips(card.char)}</span>
        </button>`
    )
    .join("");
}
