// El (hand) görseli — yelpaze, sürüklenebilir kartlar, desteden geliş animasyonu.
// Sadece DOM; state OKUR. Alana dizilmiş (ui.word) harfler elde GÖSTERİLMEZ.

import { letterChips } from "../data/letterValues.js";

// justDealt: bu render'da YENİ gelen kart id'leri (deal-in animasyonu için).
export function renderHand(container, state, ui, justDealt = new Set()) {
  const staged = new Set(ui.word);
  const cards = state.round.hand.filter((c) => !staged.has(c.id));
  const mid = (cards.length - 1) / 2;

  container.innerHTML = cards
    .map((card, i) => {
      const rot = mid === 0 ? 0 : ((i - mid) / mid) * 6; // yelpaze eğimi
      const lift = Math.abs(i - mid) * 4;
      const dealt = justDealt.has(card.id);
      const cls = dealt ? " tile--dealt" : "";
      const delay = dealt ? `animation-delay:${i * 55}ms;` : "";
      return `
        <button class="tile${cls}" draggable="true" data-id="${card.id}" data-from="hand"
                style="--rot:${rot.toFixed(2)}deg; --ty:${lift.toFixed(1)}px; ${delay}" type="button">
          <span class="tile__char">${card.char}</span>
          <span class="tile__chips">${letterChips(card.char)}</span>
        </button>`;
    })
    .join("");
}
