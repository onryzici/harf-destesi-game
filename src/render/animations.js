// Juice / animasyonlar — CLAUDE.md 6.4. Saf görsel; state'i değiştirmez.
// requestAnimationFrame + CSS sınıfları. (performance.now tarayıcıda serbest.)

// Bir sayıyı from'dan to'ya sayarak yükseltir (count-up).
export function countUp(el, from, to, dur = 650) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = to;
  }
  requestAnimationFrame(frame);
}

// Bir alanın üstünde yükselip kaybolan "+skor" balonu.
export function floatScore(container, text, color = "#ffcb45") {
  const f = document.createElement("div");
  f.className = "float-score";
  f.textContent = text;
  f.style.color = color;
  container.appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

// Ekran sarsıntısı (büyük skorlarda).
export function shake(el, big = false) {
  const cls = big ? "shake--big" : "shake";
  el.classList.remove("shake", "shake--big");
  void el.offsetWidth; // reflow -> animasyonu yeniden tetikle
  el.classList.add(cls);
}
