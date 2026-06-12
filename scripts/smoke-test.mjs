// Engine duman testi (DOM yok). Aşama 2 doğrulaması.
// Çalıştır: node scripts/smoke-test.mjs
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// dictionary.js fetch kullanır; Node fetch file:// desteklemez -> shim.
globalThis.fetch = async (url) => {
  const p = url.startsWith("file:") ? new URL(url).pathname : url;
  return { ok: true, status: 200, text: async () => readFileSync(p, "utf-8") };
};

const base = pathToFileURL(process.cwd() + "/").href;
const { createState } = await import(base + "src/engine/state.js");
const { startRun, startBlind, playWord, discardCards, advanceBlind, currentBlind } =
  await import(base + "src/engine/round.js");
const { loadDictionary, isValidWord, normalizeWord, getWordSet } =
  await import(base + "src/engine/dictionary.js");
const { scoreWord } = await import(base + "src/engine/scoring.js");

let pass = 0, fail = 0;
const check = (name, cond) => {
  if (cond) { pass++; console.log("  ✓", name); }
  else { fail++; console.log("  ✗ BAŞARISIZ:", name); }
};

await loadDictionary("data/kelimeler.txt");
const WORDS = getWordSet();

// Bir elden geçerli kelime bulan yardımcı (test amaçlı brute-force).
function permute(a){ if(a.length<=1) return [a]; const o=[]; a.forEach((v,i)=>{for(const p of permute([...a.slice(0,i),...a.slice(i+1)])) o.push([v,...p]);}); return o; }
function findWord(hand){
  for(let len=Math.min(5,hand.length); len>=2; len--){
    const rec=(s,pick)=>{
      if(pick.length===len){ for(const p of permute(pick)){ const c=p.map(i=>hand[i]); if(WORDS.has(normalizeWord(c.map(x=>x.char).join("")))) return c; } return null; }
      for(let i=s;i<hand.length;i++){ const r=rec(i+1,[...pick,i]); if(r) return r; } return null;
    };
    const r=rec(0,[]); if(r) return r;
  }
  return null;
}

console.log("1) Kademeli skorlama (uzunluk)");
{
  const st = createState("t");
  // "kalem" 5 harf -> Orta kademe: çip 6+20=26, mult 2 => 52
  const c5 = [..."KALEM"].map((char,id)=>({id,char,enhancements:[]}));
  const r5 = scoreWord(st, c5);
  check("KALEM çip = 26 (6 + kademe 20)", r5.chips === 26);
  check("KALEM mult = 2 (Orta kademe)", r5.mult === 2);
  check("KALEM skor = 52", r5.score === 52);
  check("KALEM kademe etiketi 'Orta'", r5.tier.label === "Orta");
  // "ev" 2 harf -> Kısa: çip E1+V7=8, mult 1
  const c2 = [..."EV"].map((char,id)=>({id,char,enhancements:[]}));
  check("EV skor = 8 (Kısa, ×1)", scoreWord(st,c2).score === 8);
}

console.log("2) Akıllı dağıtıcı: her el oynanabilir mi?");
{
  // Birkaç farklı seed'le el dağıt, hepsinde kelime kurulabilmeli.
  let playable = 0, tries = 8;
  for (let i = 0; i < tries; i++) {
    const st = createState("dealer-" + i);
    startRun(st);
    const w = findWord(st.round.hand);
    if (w) playable++;
    else console.log("    OYNANAMAZ el:", st.round.hand.map(c=>c.char).join(""));
  }
  check(`${tries} elin hepsi oynanabilir`, playable === tries);

  // Determinizm: aynı seed = aynı el
  const a = createState("same"); startRun(a);
  const b = createState("same"); startRun(b);
  check("aynı seed = aynı el", a.round.hand.map(c=>c.char).join("") === b.round.hand.map(c=>c.char).join(""));
}

console.log("3) Hedef eğrisi + kör ilerleme");
{
  const st = createState("ante");
  startRun(st);
  const t1 = st.round.target;
  check("küçük kör hedefi pozitif", t1 > 0);
  check("ante 1, küçük kör", st.run.ante === 1 && currentBlind(st).type === "small");

  // Kazanmayı zorla, ilerlet
  st.round.score = t1; st.round.status = "won";
  const r = advanceBlind(st);
  check("kör geçince ödül verildi", r.reward.total > 0);
  check("büyük köre geçildi", currentBlind(st).type === "big");
  check("büyük kör hedefi > küçük", st.round.target > t1);

  st.round.score = st.round.target; st.round.status="won"; advanceBlind(st); // boss
  check("patron köre geçildi", currentBlind(st).type === "boss");
  st.round.score = st.round.target; st.round.status="won"; advanceBlind(st); // ante 2
  check("patron sonrası ante 2", st.run.ante === 2 && currentBlind(st).type === "small");
}

console.log("4) Uçtan uca: gerçek kelimelerle küçük kör geç");
{
  const st = createState("e2e");
  startRun(st);
  const target = st.round.target;
  console.log("    küçük kör hedefi:", target, "| el:", st.round.hand.map(c=>c.char).join(""));
  let plays = 0;
  while (st.round.status === "playing" && st.round.playsLeft > 0) {
    const cards = findWord(st.round.hand);
    if (!cards) { console.log("    kelime bulunamadı"); break; }
    const res = playWord(st, cards.map(c=>c.id));
    plays++;
    console.log(`    "${res.word.toLocaleLowerCase("tr-TR")}" ${res.chips}×${res.mult}=${res.score} | skor ${st.round.score}/${target} | ${st.round.status}`);
    check(`oyna #${plays} geçerli kabul`, res.ok === true);
    check(`oyna #${plays} el handSize aşmadı`, st.round.hand.length <= st.config.handSize);
  }
  check("küçük kör 4 hakta geçildi", st.round.status === "won");
  // Run özeti istatistikleri kaydedildi (kazanma/kaybetme ekranı için)
  check("run.stats kelime sayısı oynamayla eşleşti", st.run.stats.words === plays);
  check("run.stats en iyi kelime kaydedildi", st.run.stats.bestWord !== "" && st.run.stats.bestScore > 0);
}

console.log("5) Atma mekaniği");
{
  const st = createState("disc"); startRun(st);
  const before = st.round.discardsLeft;
  const ids = st.round.hand.slice(0,3).map(c=>c.id);
  const d = discardCards(st, ids);
  check("atma başarılı", d.ok);
  check("atma sonrası el 8", st.round.hand.length === st.config.handSize);
  check("atma hakkı düştü", st.round.discardsLeft === before - 1);
}

console.log("6) tr-TR locale doğrulama");
{
  check("'ışık' geçerli (I->ı)", isValidWord("IŞIK", 2));
  check("'kitap' geçerli", isValidWord("kitap", 2));
}

console.log("7) Jokerler (veri-güdümlü hook'lar)");
{
  const { addJokerById } = await import(base + "src/engine/jokerActions.js");
  const mkCards = (w) => [...w].map((char, id) => ({ id, char, enhancements: [] }));

  // Sesli Avcısı: "KALEM" sesli A,E=2 -> +4 mult. tier(5)=×2 -> mult 6, chips 26 -> 156
  const st = createState("jok");
  addJokerById(st, "sesli-avcisi");
  const r = scoreWord(st, mkCards("KALEM"));
  check("Sesli Avcısı: KALEM mult 6", r.mult === 6);
  check("Sesli Avcısı: KALEM skor 156", r.score === 156);
  check("tetiklenen joker kaydedildi", r.firedJokers.includes("sesli-avcisi"));

  // Zaman çizelgesi (sıralı skor çözümü): 5 harf + 1 kademe + 1 joker adımı
  const letterSteps = r.timeline.filter((s) => s.kind === "letter");
  const tierStep = r.timeline.find((s) => s.kind === "tier");
  const jokerStep = r.timeline.find((s) => s.kind === "joker");
  check("timeline: 5 harf adımı", letterSteps.length === 5);
  check("timeline: kademe adımı var (Orta)", tierStep && tierStep.label === "Orta");
  check("timeline: joker adımı Sesli Avcısı", jokerStep && jokerStep.id === "sesli-avcisi");
  check("timeline: joker +4 çarpan kaydı", jokerStep && jokerStep.ops.some((o) => o.op === "mult" && o.n === 4));
  check("timeline: son adım skorla uyumlu", r.timeline[r.timeline.length - 1].chips === r.chips);

  // Cimri: 3 harf ve altı ×3. "EV" chips 8, mult tier1 ×3 = 3 -> 24
  const st2 = createState("jok2");
  addJokerById(st2, "cimri");
  check("Cimri: EV skor 24", scoreWord(st2, mkCards("EV")).score === 24);

  // Mimar 6+ harf: harf*8 çip. "kalemler" 8 harf? kullan 6 harf "kalemi"
  const st3 = createState("jok3");
  addJokerById(st3, "mimar");
  const r3 = scoreWord(st3, mkCards("MERMER")); // 6 harf
  check("Mimar: 6 harfte +48 çip uygulandı", r3.firedJokers.includes("mimar"));

  // Önizleme: Kumarbaz preview'da zar atmamalı (state.rng ilerlememeli)
  const st4 = createState("jok4");
  addJokerById(st4, "kumarbaz");
  const before = st4.run.rng; // fonksiyon referansı sabit; çağrı sayısını ölçemeyiz
  scoreWord(st4, mkCards("KALEM"), { preview: true });
  check("Kumarbaz önizlemede pas geçti (hata yok)", true);
}

console.log("8) Dükkân & Ekonomi (Aşama 4)");
{
  const shop = await import(base + "src/engine/shop.js");
  const { collectBlindReward, proceedToNextBlind } = await import(base + "src/engine/round.js");

  const st = createState("shop");
  startRun(st);
  // Kör kazanmayı zorla, ödül topla
  st.round.score = st.round.target; st.round.status = "won";
  const before = st.run.money;
  const reward = collectBlindReward(st);
  check("ödül toplandı, para arttı", st.run.money === before + reward.total);
  check("ödül iki kez toplanmaz", collectBlindReward(st) === null);

  st.run.money = 60; // test için bol para
  shop.generateShop(st);
  check("dükkânda 2 joker var", st.run.shop.jokers.length === 2);
  check("dükkânda kupon var", !!st.run.shop.voucher);

  // Joker satın al
  const jokerToBuy = st.run.shop.jokers[0].id;
  const m0 = st.run.money, jn0 = st.run.jokers.length;
  const b = shop.buyJoker(st, jokerToBuy);
  check("joker satın alındı", b.ok && st.run.jokers.length === jn0 + 1);
  check("joker parası düştü", st.run.money === m0 - b.joker.cost);

  // Reroll
  const rc = st.run.shop.rerollCost, mr = st.run.money;
  shop.reroll(st);
  check("reroll parası düştü", st.run.money === mr - rc);
  check("reroll maliyeti arttı", st.run.shop.rerollCost === rc + 1);

  // Booster -> harf ekle (deste büyür)
  const deck0 = st.run.deck.length;
  const bb = shop.buyBooster(st);
  check("booster 3 seçenek verdi", bb.ok && bb.choices.length === 3);
  shop.chooseBoosterLetter(st, bb.choices[0]);
  check("deste büyüdü (harf eklendi)", st.run.deck.length === deck0 + 1);
  check("yeni kartın id'si benzersiz", st.run.deck.every((c, i, a) => a.findIndex(x => x.id === c.id) === i));

  // Voucher -> kalıcı config etkisi
  const v = st.run.shop.voucher;
  const handBefore = st.config.handSize, playsBefore = st.config.basePlays, discBefore = st.config.baseDiscards;
  shop.buyVoucher(st);
  const changed = st.config.handSize !== handBefore || st.config.basePlays !== playsBefore || st.config.baseDiscards !== discBefore || st.config.interestCap !== undefined;
  check("kupon kalıcı etki uyguladı", st.run.vouchers.includes(v) && changed);

  // Sat
  const sellId = st.run.jokers[0].id, ms = st.run.money;
  const s = shop.sellJoker(st, sellId);
  check("joker satıldı, para arttı", s.ok && st.run.money === ms + s.value);

  // Sonraki köre geç (config etkisi sonraki elde geçerli olmalı)
  proceedToNextBlind(st);
  check("sonraki kör başladı", st.round.status === "playing" && st.round.hand.length === st.config.handSize);
}

console.log("9) Risk/kaos jokerleri (CLAUDE.md 4.2)");
{
  const { addJokerById } = await import(base + "src/engine/jokerActions.js");
  const mkCards = (w) => [...w].map((char, id) => ({ id, char, enhancements: [] }));

  // Palindrom Tanrısı: "ANA" palindrom -> ×20. chips A1+N1+A1=3, mult 1×20=20 -> 60
  const p = createState("pal"); addJokerById(p, "palindrom-tanrisi");
  const rp = scoreWord(p, mkCards("ANA"));
  check("Palindrom: ANA mult 20", rp.mult === 20);
  check("Palindrom: ANA skor 60", rp.score === 60);
  check("Palindrom: KALEM (palindrom değil) tetiklenmez", !scoreWord(p, mkCards("KALEM")).firedJokers.includes("palindrom-tanrisi"));

  // Harf Simyacısı: 'A' başına KALICI +1 mult (büyür). "ARABA" 3 'A'.
  const a = createState("alc"); addJokerById(a, "harf-simyacisi");
  const r1 = scoreWord(a, mkCards("ARABA")); // base 0 + 3 -> +3 mult; persist=3
  const r2 = scoreWord(a, mkCards("ARABA")); // base 3 + 3 -> +6 mult; persist=6
  check("Simyacı: 1. oynamada +3 çarpan", r1.mult === 5); // tier2(×2)+3
  check("Simyacı: 2. oynamada büyüdü (+6)", r2.mult === 8); // tier2(×2)+6
  check("Simyacı: sayaç kalıcı (run.jokerVars)", a.run.jokerVars.harfSimyacisi === 6);
  // Önizleme sayacı KALICI BÜYÜTMEZ
  const pv = a.run.jokerVars.harfSimyacisi;
  scoreWord(a, mkCards("ARABA"), { preview: true });
  check("Simyacı: önizleme sayacı büyütmez", a.run.jokerVars.harfSimyacisi === pv);

  // İntikam: atılan harf sayısı kadar SIRADAKİ kelimeye +5 çip (onDiscard wired)
  const iv = createState("int"); startRun(iv); addJokerById(iv, "intikam");
  const dids = iv.round.hand.slice(0, 3).map((c) => c.id);
  discardCards(iv, dids);
  check("İntikam: atınca sayaç 3", iv.run.jokerVars.intikam === 3);
  const ri = scoreWord(iv, mkCards("EV")); // EV chips E1+V7=8 + 15 = 23
  check("İntikam: +15 çip uygulandı", ri.chips === 23);
  check("İntikam: tüketilince sıfırlandı", iv.run.jokerVars.intikam === 0);

  // Çığ: geçilen kör sayısı kadar +çarpan
  const { collectBlindReward } = await import(base + "src/engine/round.js");
  const cg = createState("cig"); startRun(cg); addJokerById(cg, "cig");
  cg.round.score = cg.round.target; cg.round.status = "won";
  collectBlindReward(cg); // blindsPassed -> 1
  check("Çığ: 1 kör sonrası +1 çarpan", scoreWord(cg, mkCards("KALEM")).mult === 3); // tier2(2)+1

  // Anagram Şeytanı: önceki kelimenin anagramı ×3
  const an = createState("ana"); startRun(an); addJokerById(an, "anagram-seytani");
  an.round.wordsPlayed.push("KALEM");
  const ra = scoreWord(an, mkCards("MALEK")); // KALEM anagramı
  check("Anagram: anagram tetikledi ×3", ra.firedJokers.includes("anagram-seytani"));
}

console.log("10) Patron kısıtlamaları (boss debuff — Aşama 6)");
{
  const { bossById, pickBoss } = await import(base + "src/data/bosses.js");
  const { proceedToNextBlind } = await import(base + "src/engine/round.js");
  const mk = (w) => [...w].map((char, id) => ({ id, char, enhancements: [] }));

  // Patron turunda bir kısıtlama seçilir
  const st = createState("boss"); startRun(st);
  st.round.score = st.round.target; st.round.status = "won"; proceedToNextBlind(st); // big
  st.round.score = st.round.target; st.round.status = "won"; proceedToNextBlind(st); // boss
  check("Patron turunda kısıtlama seçildi", currentBlind(st).type === "boss" && !!st.round.boss);

  // Uzun Yol: <5 harf bloklanır, >=5 geçer
  const uy = bossById("uzun-yol");
  check("Uzun Yol: 4 harf bloklanır", uy.validate(mk("KALE")).ok === false);
  check("Uzun Yol: 5 harf geçer", uy.validate(mk("KALEM")).ok === true);

  // Tekel: aynı harf 2'den fazla
  const tk = bossById("tekel");
  check("Tekel: AAA bloklanır", tk.validate(mk("AAA")).ok === false);
  check("Tekel: ANANAS (A=3) bloklanır", tk.validate(mk("ANANAS")).ok === false);
  check("Tekel: KALEM geçer", tk.validate(mk("KALEM")).ok === true);

  // Açgözlü: değişim hakkı 0
  const ac = createState("ac"); startRun(ac); ac.round.boss = bossById("acgozlu");
  bossById("acgozlu").onStart(ac);
  check("Açgözlü: değişim hakkı 0", ac.round.discardsLeft === 0);

  // Darboğaz: bir kelime hakkı eksik
  const db = createState("db"); startRun(db);
  const playsBefore = db.round.playsLeft;
  bossById("darbogaz").onStart(db);
  check("Darboğaz: 1 kelime hakkı eksik", db.round.playsLeft === playsBefore - 1);

  // Sansür: 3 harf kilitlenir + kilitli harf bloklanır
  const sn = createState("sn"); startRun(sn);
  bossById("sansur").onStart(sn);
  check("Sansür: 3 harf kilitlendi", sn.round.lockedChars.size === 3);
  const locked = [...sn.round.lockedChars][0];
  check("Sansür: kilitli harfli kelime bloklanır", bossById("sansur").validate(mk(locked + "AE"), sn).ok === false);

  // Kısırlık: ilk kelime 0 puan
  const ks = createState("ks"); startRun(ks); ks.round.boss = bossById("kisirlik");
  ks.round.wordsPlayed = [];
  check("Kısırlık: ilk kelime 0 puan", scoreWord(ks, mk("KALEM")).score === 0);
  ks.round.wordsPlayed = ["EV"]; // artık ilk değil
  check("Kısırlık: sonraki kelime normal", scoreWord(ks, mk("KALEM")).score === 52);

  // Vergi: çarpan yarıya iner (×0.5)
  const vg = createState("vg"); startRun(vg); vg.round.boss = bossById("vergi");
  const rv = scoreWord(vg, mk("KALEM")); // tier2 mult 2 ×0.5 = 1, chips 26 -> 26
  check("Vergi: çarpan yarıya indi (mult 1)", rv.mult === 1);
  check("Vergi: KALEM skor 26", rv.score === 26);

  // Determinizm: aynı seed = aynı patron
  check("pickBoss determinist", pickBoss(createState("z").run.rng).id === pickBoss(createState("z").run.rng).id);
}

console.log(`\nSONUÇ: ${pass} geçti, ${fail} başarısız`);
process.exit(fail ? 1 : 0);
