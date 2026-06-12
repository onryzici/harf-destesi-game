// Gerçek tarayıcı etkileşim testi (CDP). main.js'in tıklama/oyna/animasyon
// akışını GERÇEK sayfada sürer. Node v22+ (global WebSocket/fetch) gerekir.
// Çalıştır (önce 'python3 -m http.server 8000' açık olmalı): node scripts/browser-test.mjs
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UDD = "/tmp/wordtro-cdp-" + Date.now();
const PORT = 9333;

const proc = spawn(CHROME, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${UDD}`, "--window-size=1280,720",
  "http://localhost:8000/index.html",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://localhost:${PORT}/json`)).json();
      const page = list.find((t) => t.type === "page" && t.url.includes("localhost:8000"));
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("DevTools hedefi bulunamadı");
}

// Sayfa içinde çalışacak senaryo: birkaç köründe gerçek kelimeler oyna.
async function scenario() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Ana menü: sözlük yüklenip OYNA açılınca (metin "OYNA") tıkla, oyunu başlat.
  const playMenu = document.getElementById("menu-play");
  for (let i = 0; i < 120 && (playMenu.disabled || playMenu.textContent !== "OYNA"); i++) await wait(150);
  // El gelene dek tıklamayı tekrarla (zamanlama güvenliği).
  for (let i = 0; i < 40 && document.querySelectorAll("#hand .tile").length === 0; i++) {
    playMenu.click();
    await wait(150);
  }

  const norm = (s) => s.trim().toLocaleLowerCase("tr-TR");
  const W = new Set((await (await fetch("data/kelimeler.txt")).text()).split("\n").map(norm).filter(Boolean));
  const permute = (a) => a.length <= 1 ? [a] : a.flatMap((v, i) => permute([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [v, ...p]));
  const handChars = () => [...document.querySelectorAll("#hand .tile")].map((t) => t.querySelector(".tile__char").textContent);

  function findSeq() {
    const chars = handChars();
    for (let len = Math.min(5, chars.length); len >= 2; len--) {
      const rec = (s, pick) => {
        if (pick.length === len) { for (const p of permute(pick)) { if (W.has(norm(p.map((i) => chars[i]).join("")))) return p.map((i) => chars[i]); } return null; }
        for (let i = s; i < chars.length; i++) { const r = rec(i + 1, [...pick, i]); if (r) return r; } return null;
      };
      const r = rec(0, []); if (r) return r;
    }
    return null;
  }
  async function stage(seq) {
    for (const ch of seq) {
      const tiles = [...document.querySelectorAll("#hand .tile")];
      const t = tiles.find((x) => x.querySelector(".tile__char").textContent === ch);
      if (!t) return false;
      t.click(); await wait(40);
    }
    return true;
  }

  const log = [];
  let safety = 0;
  while (safety++ < 30) {
    const overlayShown = document.getElementById("overlay").classList.contains("overlay--show");
    if (overlayShown) {
      // kör geçildi -> devam et (sonraki köre)
      const title = document.getElementById("overlay-title").textContent;
      if (title.includes("KAZANDIN")) { log.push("RUN KAZANILDI"); break; }
      log.push(`OVERLAY: ${title}`);
      document.getElementById("overlay-btn").click();
      await wait(300);
      if (log.filter((l) => l.startsWith("OVERLAY")).length >= 3) break; // 3 kör test yeter
      continue;
    }
    const seq = findSeq();
    if (!seq) { log.push("kelime bulunamadı"); break; }
    const before = +document.getElementById("round-score").textContent;
    const ok = await stage(seq);
    if (!ok) { log.push("dizme hatası"); break; }
    document.getElementById("play-btn").click();
    // Sıralı skor çözümü animasyonu bitene kadar bekle (buton tekrar açılır
    // ya da kör geçilip overlay açılır).
    for (let i = 0; i < 60; i++) {
      const btn = document.getElementById("play-btn");
      const ov = document.getElementById("overlay").classList.contains("overlay--show");
      if (ov || !btn.disabled) break;
      await wait(80);
    }
    await wait(120);
    const after = +document.getElementById("round-score").textContent;
    log.push(`oyna "${norm(seq.join(""))}" : ${before} -> ${after}`);
  }

  return JSON.stringify({
    blind: document.getElementById("blind-name").textContent,
    ante: document.getElementById("ante").textContent,
    roundNum: document.getElementById("round-num").textContent,
    money: document.getElementById("money").textContent,
    score: document.getElementById("round-score").textContent,
    deck: document.getElementById("deck-count").textContent,
    log,
  });
}

let ws, proc_killed = false;
function cleanup() {
  if (proc_killed) return; proc_killed = true;
  try { ws?.close(); } catch {}
  try { proc.kill("SIGKILL"); } catch {}
  try { rmSync(UDD, { recursive: true, force: true }); } catch {}
}

try {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Runtime.enable");
  const expr = `(${scenario.toString()})()`;
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  const value = r.result?.result?.value;
  if (value) {
    const out = JSON.parse(value);
    console.log("── Tarayıcı oynama testi ──");
    out.log.forEach((l) => console.log("  " + l));
    console.log(`\n  kör: ${out.blind} | ante ${out.ante} | kör# ${out.roundNum} | para ${out.money} | skor ${out.score} | deste ${out.deck}`);
    const won = out.log.some((l) => l.startsWith("OVERLAY: Tur Geçildi") || l.includes("KAZANILDI"));
    console.log(won ? "\n✓ Tarayıcıda: menü→OYNA→diz→skor→tur geçişi ÇALIŞIYOR" : "\nⓘ Akış çalıştı (tur geçişi gözlenmedi)");
  } else {
    console.log("Beklenmeyen sonuç:", JSON.stringify(r).slice(0, 500));
  }
} finally {
  cleanup();
}
