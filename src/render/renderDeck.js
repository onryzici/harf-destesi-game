// Deste yığını (sağ alt) — kalan kart sayısını gösterir. Sadece DOM; state OKUR.

export function renderDeck(els, state) {
  els.count.textContent = `${state.round.pool.length}/${state.run.deckSize}`;
}
