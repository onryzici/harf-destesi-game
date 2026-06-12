// Sıralı skor çözümü — Balatro'nun dopamin anı (CLAUDE.md 6.3/6.4).
// Engine'in ürettiği `timeline`'ı ADIM ADIM oynatır: her harf pop yapar ve
// çipini ekler → her joker SIRAYLA tetiklenir, üstüne sayı uçuşur → en sonda
// ÇİP × ÇARPAN tokmak gibi çarpışır → skor patlar. Saf görsel; state okumaz.

import { burst, confetti } from "./particles.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Bir elemanı kısa süreliğine "zıplatır" (pulse). Sınıfı yeniden tetiklemek
// için reflow ile sıfırlanır.
function pulse(el, cls = "pulse") {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Çip/çarpan hap değerini güncelle + zıplat.
function setPill(el, value) {
  if (!el) return;
  el.textContent = value;
  pulse(el);
}

// Bir kartın yanında yukarı uçup kaybolan rozet (+15, +4, ×2 …).
function floatBadge(anchor, layer, text, color) {
  if (!anchor || !layer) return;
  const a = anchor.getBoundingClientRect();
  const l = layer.getBoundingClientRect();
  const b = document.createElement("div");
  b.className = "fx-badge";
  b.textContent = text;
  b.style.color = color;
  b.style.left = a.left - l.left + a.width / 2 + "px";
  b.style.top = a.top - l.top + "px";
  layer.appendChild(b);
  setTimeout(() => b.remove(), 850);
}

// op -> görsel rozet metni + renk.
function opBadge(op) {
  if (op.op === "chip") return { text: `+${op.n}`, color: "#7fb3ff" };
  if (op.op === "mult") return { text: `+${op.n}`, color: "#ff8a6e" };
  if (op.op === "xmult") return { text: `×${op.n}`, color: "#ff8a6e" };
  return null;
}

// Büyük kutlama yazısını gösterir (hype seviyesine göre büyür).
function showBanner(layer, score, hype) {
  if (!layer) return;
  const labels = ["", "SÜPER!", "MUHTEŞEM!", "İNANILMAZ!"];
  const wrap = document.createElement("div");
  wrap.className = `score-banner score-banner--${hype}`;
  const word = labels[hype];
  wrap.innerHTML =
    (word ? `<div class="score-banner__word">${word}</div>` : "") +
    `<div class="score-banner__num">+${score}</div>`;
  layer.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1300);
}

const centerOf = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

// Zaman çizelgesini oynatır. Bittiğinde { hype } döndürür.
// opts: { timeline, result, target, chipsEl, multEl, boardSlotsEl,
//         jokerShelfEl, feltEl, fxLayer, speed, particles }
//   speed: animasyon hızı çarpanı (büyük = hızlı); particles: parçacık aç/kapa
export async function playScoreSequence(opts) {
  const { timeline, result, target, chipsEl, multEl, boardSlotsEl, jokerShelfEl, feltEl, fxLayer } = opts;
  const speed = opts.speed || 1;
  const fx = opts.particles !== false;
  const wait = (ms) => sleep(ms / speed); // hıza göre ölçekli bekleme
  const boardTiles = [...boardSlotsEl.querySelectorAll(".tile")];
  let li = 0;

  const firstMult = timeline.find((s) => s.kind === "letter")?.mult ?? result.mult;
  setPill(chipsEl, 0);
  setPill(multEl, firstMult);

  for (const step of timeline) {
    if (step.kind === "letter") {
      const tile = boardTiles[li++];
      if (tile) {
        pulse(tile, "tile--scoring");
        const r = tile.getBoundingClientRect();
        if (step.base) floatBadge(tile, fxLayer, `+${step.base}`, "#7fb3ff");
      }
      setPill(chipsEl, step.chips);
      if (step.mult !== firstMult) setPill(multEl, step.mult);
      // harf-üstü geliştirme (foil/holo) varsa ayrıca göster
      for (const op of step.ops) {
        const bd = opBadge(op);
        if (bd && tile) floatBadge(tile, fxLayer, bd.text, bd.color);
      }
      await wait(125);
    } else if (step.kind === "tier") {
      if (step.base > 0) {
        setPill(chipsEl, step.chips);
        await wait(190);
      }
    } else {
      // joker / patron — sahnenin yıldızı: kart titrer, sayı uçar, hap zıplar
      const card = jokerShelfEl.querySelector(`[data-jid="${step.id}"]`);
      if (card) pulse(card, "joker--fired");
      for (const op of step.ops) {
        const bd = opBadge(op);
        if (bd) floatBadge(card || jokerShelfEl, fxLayer, bd.text, bd.color);
      }
      setPill(chipsEl, step.chips);
      setPill(multEl, step.mult);
      if (card && fx) {
        const c = centerOf(card.getBoundingClientRect());
        burst(c.x, c.y, { count: 12, power: 3, colors: ["#d9a441", "#c0492f"] });
      }
      await wait(330);
    }
  }

  // FINAL — çip × çarpan çarpışması
  await wait(120);
  pulse(chipsEl, "slam");
  pulse(multEl, "slam");
  await wait(200);

  const ratio = target ? result.score / target : 0;
  const hype = ratio >= 1 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.25 ? 1 : 0;
  showBanner(fxLayer, result.score, hype);

  if (fx) {
    const fr = feltEl.getBoundingClientRect();
    burst(fr.left + fr.width / 2, fr.top + fr.height * 0.42, {
      count: 22 + hype * 26,
      power: 4 + hype * 1.6,
      colors: ["#d9a441", "#2f5fa6", "#c0492f", "#4f9d6b"],
    });
    if (hype >= 3) confetti({ count: 110 });
  }

  await wait(260);
  return { hype };
}
