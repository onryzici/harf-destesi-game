// Sol bilgi paneli — Balatro referansı. Sadece DOM; state'i OKUR.

// els: { blindName, blindReq, roundScore, tierLabel, chips, mult, tierBox,
//        plays, discards, money, ante, roundNum, message }
export function renderSidebar(els, state, ui) {
  const { run, round } = state;
  const p = ui.preview;

  // Tur rozeti
  els.blindName.textContent = round.blind.name;
  els.blindName.style.setProperty("--blind", round.blind.color);
  els.blindReq.textContent = round.target;
  els.roundScore.textContent = round.score;

  // Patron kısıtlaması uyarısı (varsa)
  if (els.bossInfo) {
    const boss = round.boss;
    if (boss) {
      let desc = boss.description;
      if (round.lockedChars && round.lockedChars.size) {
        desc += " (" + [...round.lockedChars].join(" ") + ")";
      }
      els.bossInfo.innerHTML = `<span class="boss-info__name">${boss.icon || "⚠️"} ${boss.name}</span><span class="boss-info__desc">${desc}</span>`;
      els.bossInfo.hidden = false;
    } else {
      els.bossInfo.hidden = true;
    }
  }

  // Kademe kutusu (canlı çip × çarpan)
  els.tierLabel.textContent = p ? `${p.word.length} harf · ${p.tier.label}` : "Kelime kur";
  els.chips.textContent = p ? p.chips : 0;
  els.mult.textContent = p ? p.mult : 1;
  els.tierBox.classList.toggle("tier-box--valid", !!(p && p.valid));
  els.tierBox.classList.toggle("tier-box--invalid", !!(p && !p.valid));

  // Sayaçlar / ekonomi / ilerleme
  els.plays.textContent = round.playsLeft;
  els.discards.textContent = round.discardsLeft;
  els.money.textContent = "$" + run.money;
  els.ante.textContent = `${run.ante}/${state.config.maxAnte}`;
  els.roundNum.textContent = `${run.blindIndex + 1}/3`;

  els.message.textContent = ui.message || "";
}
