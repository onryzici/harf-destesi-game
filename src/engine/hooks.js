// Kanca (hook) sistemi — CLAUDE.md 7.4. Jokerlerin ve patron körlerin sırrı.
// Skorlama, joker/patron efektlerini OLAYLAR üzerinden çalıştırır; böylece
// yeni joker eklemek scoring.js'i değiştirmez (kural 2).
//
// Jokerler SOLDAN SAĞA işlenir — sıralama strateji yaratır (CLAUDE.md 4.1).

// Bir kaynağın (joker/patron) hook'unu çalıştırır; çip/çarpan değiştirdiyse
// `_fired`'a id'sini, `_timeline` varsa sıralı bir "joker" adımı yazar.
// Adım, kaynağın yaptığı işlemleri (ops) ve sonrası çip/çarpanı taşır —
// render katmanı bunu adım adım oynatır.
function fireHook(source, hook, ctx, eventName) {
  // Skorlama dışı olaylarda (onDiscard vb.) çip/çarpan/ops yoktur — yan etki içindir.
  const opStart = ctx._ops ? ctx._ops.length : 0;
  const c0 = ctx.chips, m0 = ctx.mult;
  hook(ctx);
  const changed = ctx.chips !== c0 || ctx.mult !== m0;
  if (!changed) return;
  if (ctx._fired) ctx._fired.add(source.id);
  // Yalnızca kelime skorlamasındaki jokerler görsel zaman çizelgesine girer
  // (harf-içi onLetterScored katkıları zaten harf adımına dahil ediliyor).
  if (ctx._timeline && eventName === "onWordScored") {
    ctx._timeline.push({
      kind: source._boss ? "boss" : "joker",
      id: source.id,
      name: source.name,
      icon: source.icon,
      ops: ctx._ops.slice(opStart),
      chips: ctx.chips,
      mult: ctx.mult,
    });
  }
}

// Bir olayı tüm aktif jokerlere (soldan sağa) ve patron köre iletir.
export function runHooks(state, eventName, ctx) {
  for (const joker of state.run.jokers) {
    const hook = joker?.hooks?.[eventName];
    if (hook) fireHook(joker, hook, ctx, eventName);
  }
  const boss = state.round.boss;
  const bossHook = boss?.hooks?.[eventName];
  if (bossHook) fireHook({ ...boss, _boss: true }, bossHook, ctx, eventName);
}
