# Wordtro — Mobil (React Native / Expo SDK 55)

> **SDK 55** kullanılıyor (56 değil). Sebep: `create-expo-app@latest` SDK 56 kurdu ama
> App Store/Play Store'daki Expo Go henüz SDK 56'yı desteklemiyordu ("project is
> incompatible with this version of Expo Go"). SDK 55, telefonlardaki güncel Expo Go ile
> uyumlu. Mağaza Expo Go'su SDK 56'ya geçince `npx expo install expo@latest && npx expo install --fix` ile yükseltilebilir.


Web sürümünün **yatay (landscape) mobil** portu. Oyun **mantığı** (engine + data) web
ile **paylaşılır**; burada sadece render/etkileşim/animasyon katmanı React Native'dir.
(CLAUDE.md Aşama 9 mantığı: mantık taşınabilir, render yeniden yazılır.)

## Çalıştırma

```bash
cd mobile
npm install          # ilk sefer
npm start            # Metro başlar (prestart → engine/data senkronu otomatik çalışır)
```

Sonra:
- **Telefonda:** Expo Go uygulamasını kur, terminaldeki QR'ı okut.
- **iOS simülatör:** `npm run ios`
- **Android emülatör:** `npm run android`

> Cihaz **yatay** kilitlidir (`app.json` + `expo-screen-orientation`).

## Mimari — paylaşılan mantık

- **Kanonik kaynak:** repo kökündeki `../src/engine` ve `../src/data` (web ile ORTAK,
  tek doğruluk kaynağı). Mobil bu dosyalara **dokunmaz**.
- **`mobile/shared/`** = bu kanonik kaynağın **üretilmiş aynası** (`scripts/sync-shared.mjs`).
  Metro proje kökü dışındaki dosyaları bu ortamda güvenilir çözemediği için engine/data
  proje kökü içine aynalanır. **`shared/` ASLA elle düzenlenmez, gitignore'dadır;**
  `npm start`/`ios`/`android`/`export` öncesi otomatik yeniden senkronlanır
  (`npm run sync` ile elle de çalıştırılabilir). Kod değişikliği daima `../src`'te yapılır.
- **`src/engineApi.ts`** = paylaşılan engine'e TEK tipli kapı (facade). `shared`'dan
  göreli import eder, dışarıya TİPLİ yeniden-export eder. Tüm mobil kod buradan erişir.

## Klasörler

```
mobile/
  App.tsx                    fontlar + yatay kilit + sözlük yükleme + menü/oyun
  src/
    engineApi.ts             paylaşılan engine'e tipli kapı
    dictionaryLoader.ts      653KB Türkçe sözlüğü asset'ten yükler (expo-asset/file-system)
    store.ts                 zustand: engine yerinde mutasyon → version tick ile render
    orchestrator.ts          giriş → engine → bump (web main.js muadili)
    theme.ts                 "Mürekkep & Parşömen" paleti + fontlar
    components/              Sidebar, JokerShelf, ScoreReadout, WordBoard, Hand, Tile,
                             Actions, GameScreen, MenuOverlay, RunOverlay
  shared/                    ÜRETİLMİŞ ayna (../src/{engine,data}) — düzenleme!
  assets/
    kelimeler.txt            sözlük (kanonik: ../data/kelimeler.txt)
    fonts/                   Jersey10 + PixelifySans (OFL — bkz. assets/CREDITS.md)
  types/engine.d.ts          paylaşılan engine'in tip biçimleri (UI tarafı)
```

## Notlar / bilinen ortam meselesi

- Bu makinedeki **watchman bozuk** (libicu uyumsuzluğu) olduğundan `metro.config.js`'te
  `useWatchman = false` ile Metro node dosya-tarayıcısına alındı. (Repo-içi, kalıcı çözüm.)
- **Türkçe büyük/küçük harf:** RN motoru Hermes'in ICU eksiği için `src/engine/turkishCase.js`
  (`trLower`) ICU'suz, açık eşlemeyle çalışır (`İ→i`, `I→ı` …). Web'de de aynı/doğru.

## Aşamalar

- **Faz A (bu sürüm):** oynanır çekirdek — yatay, dokunarak kelime kur, sözlük doğrulama,
  skor=çip×çarpan, hedef, hak/değişim, tur kazan/kaybet, bölümler arası geçiş, patron
  kısıtlamaları (engine'den), ana menü + nasıl oynanır.
- **Faz B (sıradaki):** jokerler + dükkân + patron paneli UI'a tam bağlı.
- **Faz C:** tam juice (sıralı skor çözümü, parçacık, sarsıntı), ayarlar, run özeti,
  ses; opsiyonel sürükle-sıralama.
