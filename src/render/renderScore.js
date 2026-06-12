// Skor okuması görseli — CLAUDE.md 6.3 / 6.5. Sadece DOM; state'i OKUR.

// Merkez skor panelini çizer: çip × çarpan, hedef/skor, kalan haklar, mesaj.
// ui.preview: { chips, mult, score } | null  (o an seçili kelimenin önizlemesi)
// ui.message: kullanıcıya gösterilecek geri bildirim
export function renderScore(els, state, ui) {
  const { round } = state;
  const p = ui.preview;

  // Önizleme varsa onu, yoksa son durumu (0) göster.
  els.chips.textContent = p ? p.chips : 0;
  els.mult.textContent = p ? p.mult : state.config.baseMult;

  els.target.textContent = round.target;
  els.score.textContent = round.score;
  els.plays.textContent = round.playsLeft;
  els.discards.textContent = round.discardsLeft;

  // Seçili kelimenin önizleme skoru
  els.preview.textContent = p ? `= ${p.score}` : "";

  els.message.textContent = ui.message || "";
}
