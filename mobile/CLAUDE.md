# CLAUDE.md — Harf Destesi MOBİL (devralma / hafıza dosyası)

> Bu dosya, **yeni bir Claude Code oturumunun** (örn. evdeki Windows PC) bu mobil
> projeyi sıfırdan anlayıp **Faz B'den devam edebilmesi** için yazıldı. Önce bunu oku,
> sonra `mobile/PLAN.md`'i oku. Oyun TASARIMININ tam referansı kök `../CLAUDE.md`.
> Mobil porta özgü kararlar/tuzaklar BURADADIR.

---

## 0. Tek cümle

**Harf Destesi** = Türkçe kelime-roguelike (Kelimelik × deckbuilder). Harflerden kelime
kurarsın: **skor = çip × çarpan**. Sınırlı hak, harf tutma, jokerler, patron turları.
Bu klasör (`mobile/`) oyunun **React Native / Expo (yatay, landscape)** sürümü.

## 1. Hızlı başlangıç (çalıştırma)

```bash
cd mobile
npm install
npm start          # prestart → sync-shared.mjs otomatik çalışır (aşağıya bak)
```
QR'ı **Expo Go** ile okut (telefon + PC aynı Wi-Fi). Detay/sorun giderme: `README.md`.
- iOS simülatör (sadece mac): `npm run ios` · Android emülatör: `npm run android`

## 2. EN KRİTİK MİMARİ — paylaşılan saf mantık (bunu bozma!)

- Oyun **mantığı** (`engine/` + `data/`) **web ile ORTAK** ve **SAF**'tır (DOM/RN yok).
  **Kanonik kaynak: repo kökündeki `../src/engine` ve `../src/data`.** Değişiklik DAİMA
  orada yapılır.
- **`mobile/shared/`** = bu kaynağın **ÜRETİLMİŞ AYNASI** (`scripts/sync-shared.mjs`).
  **gitignore'da, ASLA elle düzenlenmez.** `npm start/ios/android/export` öncesi `prestart`
  hook'u otomatik senkronlar. Elle: `npm run sync`. (Sebep: Metro bu ortamda proje kökü
  DIŞINDAKİ dosyaları güvenilir çözemedi → kök içine aynalıyoruz.)
- **`mobile/src/engineApi.ts`** = paylaşılan engine'e **TEK tipli kapı (facade)**. Tüm
  mobil kod engine'e BURADAN erişir (shared'dan `@ts-ignore`'lu göreli import, tipli
  re-export). Yeni bir engine fonksiyonu UI'da lazımsa önce buraya ekle.
- **ALTIN KURAL (kök CLAUDE.md kural 1-2):** `engine/`+`data/` DOM/RN'ye dokunmaz; içerik
  (joker/patron) **veri** olarak eklenir, `if (id==='...')` yazılmaz.

## 3. Diğer kritik kararlar / tuzaklar

- **Expo SDK 55** (56 DEĞİL). `create-expo-app` 56 kurmuştu ama mağaza Expo Go 56'yı
  desteklemiyordu ("incompatible"). 55'e indirildi (`npm install expo@~55 && npx expo
  install --fix`). Mağaza Expo Go 56'ya geçince yükseltilebilir.
- **`metro.config.js` `useWatchman=false`** — bu mac'te watchman bozuktu (libicu). Windows'ta
  zararsız, dokunma.
- **Türkçe büyük/küçük harf:** `../src/engine/turkishCase.js` → `trLower` (ICU'suz, açık
  eşleme `İ→i`, `I→ı`). Hermes-güvenli. `toLocaleLowerCase('tr-TR')` KULLANMA.
- **Tüm rastgelelik seed'li `state.run.rng`'den.** `Math.random()` doğrudan kullanma.
- **Patron-oynanabilirlik GARANTİSİ:** dağıtıcı (`dealer.js`) aktif patron kısıtına
  (min harf / max tekrar / kilitli harf) uyan kelime kurulabilen el verir — oyun kilitlenmez.
  Veri-güdümlü: `bosses.js` `dealer:{minLen/maxRepeat/banLocked}` + `round.js` `roundConstraint`.

## 4. TASARIM KISITI — Balatro'yu ANDIRMA (telif!)

Kullanıcının #1 kriteri: **telif yememek + piyasaya sürülebilirlik.** UI, Balatro'nun
YERLEŞİMİNİ andırmamalı. KAÇIN: sol dikey bilgi paneli · sağ üstte mavi-skor + kırmızı-
çarpan kutuları + aralarında × · üstte joker yuvası SIRASI · '-tro' isim soneki.
Mevcut çözüm = **"Yazı Masası" düzeni:** yatay üst şerit (`TopBar.tsx`, sol panel yok) ·
tek satır defter skoru (`LedgerScore.tsx`, "çip 28 × 3 = 84", kutu+× yok) · joker mum
mührü halkaları (`JokerSeals.tsx`, üst sıra yok) · kelime "yazı çizgisi" (`WordBoard.tsx`).
Tema: **"Mürekkep & Parşömen"** (koyu indigo, parşömen kart, altın/mürekkep-mavi/mum-kırmızı;
`src/theme.ts`). İsim: **HARF DESTESİ** (eski "Wordtro" — '-tro' yüzünden değişti).

## 5. ŞU AN NE DURUMDA (2026-06-12)

**Faz A BİTTİ + simülatörde doğrulandı:** çekirdek döngü oynanır (el dağıt → dokunarak
kelime kur → sözlük doğrula → çip×çarpan skor → hedef → tur kazan/kaybet → sonraki tur),
yatay, 63.583 kelimelik sözlük yükleniyor, akıllı dağıtıcı, menü/nasıl-oynanır.
**Juice (Animated):** skor count-up, defter pop, taş zıplama/desteden-geliş, geçerli-kelime
parıltı nabzı, uçan +skor, ekran sarsıntısı, haptics (`src/juice.ts`).
**"Yazı Masası" yeniden tasarımı + Harf Destesi adı** uygulandı (bkz. §4).
**DÜKKÂN HENÜZ YOK** — tur geçince doğrudan "Devam Et" ile sonraki tura geçiyor. Dükkân = Faz B.

### Bileşen haritası (`mobile/src/`)
- `App.tsx` — font + yatay kilit + sözlük yükleme + menü/oyun yönlendirme
- `store.ts` — zustand + **version tick** (engine yerinde mutasyon yapar → `bump()` ile render)
- `orchestrator.ts` — giriş→engine→bump (web `main.js` muadili): play/discard/placeTile/...
- `engineApi.ts` · `dictionaryLoader.ts` · `theme.ts` · `juice.ts`
- `components/`: GameScreen, TopBar, LedgerScore, WordBoard, Hand, Tile, Actions,
  JokerSeals, FloatingScore, CountUpText, MenuOverlay, RunOverlay
- `types/engine.d.ts` — paylaşılan engine'in UI-tarafı tipleri

## 6. Engine API yüzeyi (Faz B'de kullanacakların — hepsi `../src/engine` / `../src/data`)

- **Tur akışı** `engine/round.js`: `startRun, startBlind, playWord(state,ids), discardCards,
  collectBlindReward, proceedToNextBlind, currentBlind` (+ `advanceBlind` kısayol)
- **Dükkân** `engine/shop.js`: `generateShop(state), buyJoker(state,id), sellJoker(state,id),
  reroll(state), buyBooster(state), chooseBoosterLetter(state,char), buyVoucher(state)`
- **Jokerler** `engine/jokerActions.js`: `MAX_JOKERS, moveJoker(state,id,toIdx),
  addJoker, removeJoker` · `data/jokers.js`: `JOKERS, jokerById` (16 joker, hooks ile)
- **Skorlama** `engine/scoring.js`: `scoreWord(state,cards,{preview}) → {chips,mult,score,
  timeline,firedJokers}` — `timeline` SAF veri, sıralı skor çözümü (Faz C) buradan oynanır.
- **Veri:** `data/bosses.js` (7 patron), `data/vouchers.js` (kuponlar), `data/blinds.js`,
  `data/wordTiers.js`, `data/letterValues.js`, `data/config.js` (CONFIG).
- **State biçimi:** `state.run` (ante, money, deck, jokers, shop, vouchers, rng, stats…) +
  `state.round` (blind, boss, target, score, playsLeft, discardsLeft, hand, pool…). Detay:
  kök `../CLAUDE.md` §7.3 ve `types/engine.d.ts`.

> Faz B'de engine'i YENİDEN YAZMA — yukarıdakiler zaten var ve saf. Sadece UI'a bağla.
> engine'de değişiklik gerekirse `../src/`'te yap, `npm run sync` ile aynala.

## 7. Doğrulama (kanıtla — varsayma)

- **Tip:** `npx tsc --noEmit` (mobile/ içinde).
- **Engine mantığı:** kökte `node scripts/smoke-test.mjs` (76 test) — paylaşılan kod değişince çalıştır.
- **Çalışma-zamanı:** `npm start` → iOS simülatör (mac) ya da Expo Go telefon. mac'te
  `xcrun simctl io <UDID> screenshot /tmp/x.png` ile ekran görüntüsü al + oku. Görsel render
  + sözlük "Sözlük yüklendi: 63583" logu + bir kelime oynanıp skorlanması doğrulanmalı.
- Geçici test için App.tsx'e auto-start eklersen (`setTimeout(()=>newRun(),400)`) İŞİN BİTİNCE
  KALDIR. Expo Go cihaz önbelleği bayat bundle gösterebilir → gerekirse uygulamayı sil/yeniden kur.

## 8. Sıradaki iş → `mobile/PLAN.md`

**Faz B (dükkân + jokerler + patron paneli UI)** ve **Faz C (tam juice + ayarlar + ses)**
adım adım orada. Kullanıcı non-coder, Türkçe konuşur, vizyon verir uygulamayı sana bırakır;
ama telif/Balatro-benzerliği konusunda hassas (§4) ve çalıştığını GÖRMEK ister (§7).
