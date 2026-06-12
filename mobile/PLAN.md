# PLAN.md — Harf Destesi Mobil · Yol Haritası (Faz B → C)

> Önce `mobile/CLAUDE.md`'i oku (durum + tuzaklar + engine API). Bu dosya sıradaki işleri
> adım adım verir. **engine/data ZATEN VAR ve saf — yeniden yazma, sadece UI'a bağla.**
> Her fazdan sonra: `npx tsc --noEmit` + simülatör/Expo Go'da gözle doğrula (CLAUDE.md §7).

---

## ✅ Bitti
- **Faz A:** çekirdek oynanır döngü (yatay, tap-to-build, sözlük, skor, hedef, tur/bölüm geçişi).
- **Juice (temel, Animated):** count-up, defter pop, taş animasyonları, parıltı, uçan +skor, sarsıntı, haptics.
- **"Yazı Masası" düzeni + "Harf Destesi" adı** (Balatro-benzerliğini kırma — CLAUDE.md §4).
- **Patron-oynanabilirlik garantisi** (engine dağıtıcı).

---

## 🔜 FAZ B — Dükkân + Jokerler + Patron paneli (UI'a bağlama)

**Amaç:** Tur geçince **dükkân** açılsın (joker al/sat, reroll, harf paketi, kupon), jokerler
rafta GERÇEK kart olarak görünsün ve skorlamaya etki etsin. Engine tarafı hazır (`shop.js`,
`jokerActions.js`, `jokers.js`); iş **UI + orchestrator bağlama**.

### B1. Joker rafını gerçek yap
- `JokerSeals.tsx`'i (mühür halkaları) gerçek joker kartlarına çevir ya da yanına bir
  detay görünümü ekle: her jokerin **adı + açıklaması** (long-press popover/tooltip).
  Veri: `state.run.jokers` (her biri `{id,name,description,rarity,cost,icon,hooks}`).
- Jokerler skorlamada zaten çalışıyor (hook sistemi). Tetiklenen jokeri vurgula:
  `scoreWord` sonucu `firedJokers` döndürür; `ui.firedJokers`'a yazılıyor — parıltı ekle.
- (Ops.) Sürükle ile yeniden sıralama → `moveJoker(state, id, toIndex)` + `bump()`.

### B2. Dükkân ekranı — yeni `components/ShopOverlay.tsx`
- Akış: tur kazan → `RunOverlay` "Tur Geçildi" → **"Dükkâna Git"** → `ShopOverlay` →
  "Sonraki Tur" → `proceedToNextBlind`. (Şu an RunOverlay doğrudan `proceedAfterWin` yapıyor;
  araya dükkânı SOK.)
- Orchestrator'a handler'lar ekle (web `main.js:238-279` mantığı): `openShop` →
  `shop.generateShop(state)`; sonra `buyJoker(id)`, `sellJoker(id)`, `reroll()`, `buyBooster()`
  → `chooseBoosterLetter(char)`, `buyVoucher()`, `nextBlind()`. Her biri engine'i çağırır + `bump()`.
- ShopOverlay içeriği (`state.run.shop`'tan): `jokers[]` (al — maliyet+açıklama), `booster`
  (4$ → 3 harf seç → desteye kat), `voucher` (kalıcı yükseltme), `rerollCost` (yenile).
  Sahip olunan jokerleri **sat** (maliyetin yarısı). Para `state.run.money`.
- "Yazı Masası" diline uydur: parşömen kartlar, mürekkep fiyat etiketi. **Balatro dükkân
  düzenini kopyalama** (CLAUDE.md §4).

### B3. Patron paneli
- TopBar'da patron şeridi zaten var (kırmızı, ad+açıklama). Patron turunda görünür.
- (Ops.) Patron başında küçük bir "uyarı" banner'ı/animasyonu.

### B4. Doğrulama
- Tur geç → dükkân açılır → joker al (para düşer) → joker rafta görünür → sonraki turda
  kelime oynayınca jokerin etkisi skora yansır (örn. "Sesli Avcısı" +2 çarpan/sesli).
- Harf paketi desteye harf ekler; kupon config'i kalıcı yükseltir (örn. +1 hak).
- `tsc` temiz + simülatör ekran görüntüsü.

**Yeni/değişen dosyalar (tahmini):** `src/components/ShopOverlay.tsx` (+ alt kartlar),
`src/components/RunOverlay.tsx` (dükkân akışına bağla), `src/components/JokerSeals.tsx`
(veya yeni `JokerCard.tsx`), `src/orchestrator.ts` (shop handler'ları), `src/store.ts`
(gerekiyorsa shop UI durumu). **engine düzenlemesi YOK** (shop.js/jokerActions zaten saf).

---

## 🔜 FAZ C — Tam juice + ayarlar + run özeti + ses

### C1. Sıralı skor çözümü (imza an — Balatro'nun "tek tek sayma"sı, özgün üslupla)
- `scoreWord` SAF `timeline` döndürür: sıralı adımlar `{kind:'letter'|'tier'|'joker'|'boss',
  char/name/icon, ops:[{op:'chip'|'mult'|'xmult', n}], chips, mult}`.
- Yeni `src/anim/useScoreSequence.ts` — web `render/scoreSequence.js`'in portu: timeline'ı
  adım adım oynat: harf pop → joker tetik + uçan +çip/×çarpan → çip×çarpan çarpışması →
  banner. `play()` akışını "anında uygula" yerine "önce animasyon, sonra temizle"ye çevir
  (`animating` kilidi store'da var). **react-native-reanimated v3** öner (daha akıcı);
  kurulumda `babel.config.js`'e `react-native-reanimated/plugin` EN SONA eklenir.
- Parçacık/konfeti: `@shopify/react-native-skia` ya da hafif Animated.View havuzu.

### C2. Ayarlar — `src/components/SettingsSheet.tsx`
- Hız (0.6/1/1.8), sarsıntı aç/kapa, parçacık aç/kapa, ses aç/kapa. Kalıcı:
  **AsyncStorage** (`@react-native-async-storage/async-storage`). Web'de `localStorage` vardı.
- Menüden erişim (MenuOverlay'de "Ayarlar" butonu zaten placeholder).

### C3. Run özeti + Nasıl Oynanır
- Kazanma/kaybetme overlay'inde istatistik (`state.run.stats`: words, bestWord, bestScore) —
  RunOverlay'de kısmen var, zenginleştir.
- "Nasıl Oynanır" MenuOverlay'de var; gerekiyorsa görselleştir.

### C4. Ses — `src/audio/` (web'de `audio/sfx.js` placeholder'dı)
- Dokunma/oynama/kazanma sesleri (`expo-av`). Telifsiz/CC0 ses kullan.

### C5. (Ops.) Sürükle-bırak
- Board tile + joker yeniden sıralama: `react-native-gesture-handler` Pan.

---

## Faz sonrası — Denge & içerik (kök CLAUDE.md Aşama 8)
- Joker sayısını büyüt (60+, hepsi `data/jokers.js`'e veri olarak).
- Hedef eğrisi (`config.anteGrowth`) ve patron çeşitliliği dengesi (playtest).
- (Çok sonra) telif: `data/kelimeler.txt` kaynağının yeniden-dağıtılabilirliğini doğrula
  (bkz. `assets/CREDITS.md`).

## Çalışma tarzı (kullanıcı tercihi)
Türkçe konuş. Non-coder; vizyon verir, uygulamayı sana bırakır. Telif/Balatro-benzerliğine
hassas (CLAUDE.md §4). Çalıştığını GÖRMEK ister — değişikliği simülatör/telefonda kanıtla.
Küçük çalışan parça → sonra cila (kök CLAUDE.md kural 3).
