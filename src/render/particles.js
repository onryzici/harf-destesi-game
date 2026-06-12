// Parçacık efektleri — CLAUDE.md 6.4. DOM üstünde küçük bir <canvas> katmanı.
// Saf görsel; state'e dokunmaz. Pixel estetiği: kareler döner, yerçekimiyle düşer.

let canvas = null;
let ctx = null;
let particles = [];
let raf = null;
let lastT = 0;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement("canvas");
  canvas.className = "fx-canvas";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function tick(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
  lastT = now;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (const p of particles) {
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.spin * dt;
    const a = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    const s = p.size * (0.4 + 0.6 * a);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  particles = particles.filter((p) => p.life > 0);

  if (particles.length) {
    raf = requestAnimationFrame(tick);
  } else {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    raf = null;
  }
}

function start() {
  if (raf == null) {
    lastT = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

const DEFAULT_COLORS = ["#ffcb45", "#4aa3ff", "#ff5a4d", "#58d68d", "#fdf6e3"];

// (x,y) noktasından parçacık patlaması fışkırtır (ekran koordinatları).
// opts: { count, power, spread(0..1), colors, gravity, size }
export function burst(x, y, opts = {}) {
  ensureCanvas();
  const count = opts.count ?? 28;
  const power = opts.power ?? 5; // px/s ölçeği (×100)
  const colors = opts.colors ?? DEFAULT_COLORS;
  const gravity = opts.gravity ?? 900;
  const size = opts.size ?? 9;
  // spread: 1 = her yöne, 0 = yukarı doğru dar koni
  const spread = opts.spread ?? 1;

  for (let i = 0; i < count; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (0.4 + spread * 1.6);
    const sp = (power * 100) * (0.5 + Math.random());
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp * (spread < 1 ? 0.6 : 1),
      vy: Math.sin(ang) * sp,
      gravity,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 12,
      size: size * (0.7 + Math.random() * 0.8),
      color: colors[(Math.random() * colors.length) | 0],
      maxLife: 0.7 + Math.random() * 0.6,
      life: 0.7 + Math.random() * 0.6,
    });
  }
  start();
}

// Tüm ekranı dolduran konfeti yağmuru (dev skorlar için kutlama).
export function confetti(opts = {}) {
  ensureCanvas();
  const count = opts.count ?? 80;
  const colors = opts.colors ?? DEFAULT_COLORS;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 120,
      vy: 120 + Math.random() * 220,
      gravity: 220,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 10,
      size: 8 + Math.random() * 8,
      color: colors[(Math.random() * colors.length) | 0],
      maxLife: 1.6 + Math.random() * 1.2,
      life: 1.6 + Math.random() * 1.2,
    });
  }
  start();
}
