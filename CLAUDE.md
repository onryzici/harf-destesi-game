# CLAUDE.md — Harf Destesi (Çalışma Adı)

> Bu dosya, projeyi geliştiren AI asistanının ve geliştiricinin **tek referans noktasıdır.**
> Oyunun ne olduğunu, nasıl çalıştığını, nasıl kodlanacağını ve hangi sırayla
> inşa edileceğini anlatır. Kod yazmadan önce ilgili bölümü oku.

---

## 1. Proje Özeti

**Tür:** Tek kişilik kelime-roguelike (deckbuilder). *Kelimelik × Balatro.*

**Platform:** Web (HTML + CSS + JavaScript). Tarayıcıda çalışır, kurulum gerektirmez.
İleride gerekirse Godot'a taşınabilir (bkz. Aşama 9).

**Dil:** Oyun içeriği **Türkçe**. Kelime doğrulama Türkçe sözlükle yapılır.
Kod içindeki değişken/fonksiyon isimleri **İngilizce** (standart pratik), açıklama
yorumları Türkçe olabilir.

**Hedef his:** Balatro'nun "çip × çarpan + joker sinerjisi" tatmini; ama poker eli
yerine **kelime kurma**. Strateji/planlama ön planda, üstüne çılgın joker kombolarının
verdiği patlama hissi.

**Nasıl çalıştırılır (başlangıçta):** `index.html` dosyasını tarayıcıda aç. Build
adımı yok. (İleride Vite'a geçilebilir — bkz. Aşama 0.)

---

## 2. Vizyon / Tek Cümle

> Harflerden kelime kurarak skor avlıyorsun: **skor = çip × çarpan.** Sınırlı kelime
> hakkı, harf tutma ve deste kurma ile her el bir bulmaca; jokerlerle her run yeni bir
> kombo motoru.

Oyuncunun beyninde dönen asıl soru her zaman şu olmalı:
*"En iyi kelimeyi şimdi mi oynasam, yoksa harf tutup / deste kurup daha büyük bir kombo mu hazırlasam?"*

---

## 3. Temel Oyun Mantığı

### 3.1 Çekirdek Döngü

```
RUN BAŞLAR
 └─ ANTE (seviye) 1..8+
     ├─ Küçük Kör (small blind)   → hedef skoru aş
     ├─ Büyük Kör (big blind)     → daha yüksek hedef
     └─ Patron Kör (boss blind)   → hedef + özel kısıtlama
         Her körden sonra → DÜKKÂN (joker/harf/yükseltme al)
 └─ Tüm anteleri geçersen → kazandın (veya endless moda geç)
 └─ Bir hedefi tutturamazsan → run biter (roguelike: baştan başla)
```

### 3.2 Skorlama (en kritik kısım)

```
chips  = harflerin çip değerleri toplamı + kelime uzunluğu kademesi taban çipi
mult   = kelime uzunluğu kademesinin taban çarpanı — jokerler/geliştirmeler artırır
score  = chips × mult
```

Hesaplama sırası (jokerlerin doğru tetiklenmesi için **bu sıra önemlidir**):

1. `chips` = harf çip değerlerini topla (harf geliştirmeleri burada eklenir)
2. Her harf için `onLetterScored` hook'ları çalışır (çip/mult ekleyebilir)
3. Kelime uzunluğu **kademesi** taban çipini ekler; taban çarpan da kademeden gelir
4. Kelime tamamı için `onWordScored` hook'ları çalışır (jokerler burada devreye girer; sıra: soldan sağa joker dizilimi)
5. `score = chips × mult` hesaplanır, tur skoruna eklenir

**Kelime uzunluğu kademeleri (Balatro'nun "poker eli" muadili):** Uzun kelime taban
çip + taban çarpan kazandırır. Jokersizken puanı oynanabilir kılar; jokerler bunun
üstüne biner. `data/wordTiers.js`'te veri olarak tutulur.

| Harf sayısı | Kademe | +Çip | Çarpan |
|-------------|--------|------|--------|
| 2–3 | Kısa | +0 | ×1 |
| 4–5 | Orta | +20 | ×2 |
| 6–7 | Uzun | +40 | ×3 |
| 8+ | Destansı | +60 | ×4 |

**Harf çip değerleri (Kelimelik puanları):**

| Çip | Harfler |
|-----|---------|
| 1 | A E İ K L N R T |
| 2 | I M O S U |
| 3 | B D Y Ü |
| 4 | C Ç Ş Z |
| 5 | G H P |
| 7 | F Ö V |
| 8 | Ğ |
| 10 | J |

> Bu değerler `data/letterValues.js` gibi tek bir yerde tutulmalı, koda gömülmemeli.

### 3.3 El ve Oynama Mekaniği

- Oyuncu her körde destesinden **el** çeker: varsayılan **8 harf**.
- **Kelime hakkı (plays):** tur başına varsayılan **4**. Bir kelime oynamak 1 hak harcar.
- **Atma hakkı (discards):** tur başına varsayılan **3**. Seçili harfleri desteye geri
  atıp yenisini çekersin; kelime hakkı harcamaz.
- **Harf tutma:** Bir kelime oynadığında sadece *kullandığın* harfler gider. Kalanlar
  elinde durur, deste 8'e tamamlanır. (Stratejinin kalbi budur.)
- **Geçerlilik:** Oynanan kelime, yüklenen Türkçe sözlükte (`Set`) bulunmalı. En az
  **2 harf**. Sözlükte yoksa oynanamaz (UI uyarı verir, hak harcanmaz).

### 3.4 Tur Yapısı / Ante / Patron

- Her ante 3 körden oluşur: küçük → büyük → patron. Hedef skorlar ante ilerledikçe
  katlanarak artar (örn. taban hedef × büyüme katsayısı^ante).
- **Patron körler** özel kısıtlamalar getirir (bkz. Bölüm 5). Bunlar puzzle/strateji
  katmanının zirvesidir; oyuncuyu o run boyunca kurduğu motoru farklı kullanmaya zorlar.

### 3.5 Ekonomi ve Dükkân

Her körü geçince oyuncu **para** kazanır:

- Taban ödül (körü geçmek)
- Kalan kelime hakkı başına bonus (verimli oyna → daha çok para)
- **Faiz:** elindeki her 5 para için +1 (tasarrufu ödüllendirir, Balatro mantığı)

Dükkânda:

- **Joker** satın al (deste/el sınırı: aynı anda max ~5 joker slotu)
- **Harf paketi (booster):** birkaç harf/geliştirme arasından seç, desteye kat
- **Kupon (voucher):** kalıcı run yükseltmeleri (örn. +1 kelime hakkı, +1 el boyutu)
- **Reroll:** dükkân stoğunu parayla yenile
- **Sat:** elindeki jokeri satıp para al

### 3.6 Deste Kurma ve Harf Geliştirmeleri

Başlangıç destesi sabit bir harf çoklu-kümesidir (örn. Türkçe harf dağılımına yakın
~50-60 harf). Run boyunca:

- **Harf ekle/çıkar:** O sinir bozucu Ğ'yi at, sesli ekle.
- **Geliştirmeler (harf üstü efektler — Balatro'nun foil/holo/poly muadili):**
  - `foil` → harf +50 çip
  - `holographic` → harf +10 çarpan
  - `polychrome` → harf ×1.5 çarpan
  - `golden` → kelime oynanınca +3 para
  - `glass` → ×2 çarpan ama %25 ihtimalle kullanınca kırılır (desteden silinir)
  - `kök` (Türkçe'ye özel) → bu harf bir kelimenin kökündeyse ekstra çip
- Bir harf hem bir "tür" (foil vb.) hem de ayrı bir "mühür" taşıyabilir (genişletilebilir).

---

## 4. Jokerler

Jokerler oyunun motoru. Hepsi **veri + efekt fonksiyonu** olarak tanımlanır; koda
serpiştirilmez. Yeni joker eklemek = bir nesne eklemek.

### 4.1 Joker Veri Modeli

```js
// data/jokers.js
{
  id: "zincir",
  name: "Zincir",
  rarity: "uncommon",          // common | uncommon | rare | legendary
  cost: 6,
  description: "Her kelime bir öncekinden uzunsa +4 Çarpan.",
  art: "zincir.png",
  // Olay kancaları: sadece ihtiyaç duyduklarını tanımla
  hooks: {
    onWordScored(ctx) {
      // ctx: { chips, mult, word, lettersScored, state, addChips(), addMult(), xMult() }
      if (ctx.word.length > ctx.state.round.lastWordLength) {
        ctx.addMult(4);
      }
    }
  }
}
```

**Mevcut olay kancaları (event hooks):**
`onRunStart`, `onAnteStart`, `onRoundStart`, `onHandDrawn`, `onLetterScored`,
`onWordScored`, `onAfterWord`, `onDiscard`, `onShopEnter`, `onCardBought`, `onSell`.

> Bir joker birden çok kancaya bağlanabilir. Jokerler **soldan sağa** sırayla işlenir
> — sıralama strateji yaratır (oyuncu jokerlerini yeniden dizebilmeli).

### 4.2 Başlangıç Joker Listesi

**Strateji jokerleri (planlamayı ödüllendirir):**

| İsim | Nadirlik | Etki |
|------|----------|------|
| Sesli Avcısı | common | Kelimedeki her sesli harf için +2 Çarpan. |
| Zincir | uncommon | Her kelime bir öncekinden uzunsa +4 Çarpan. |
| İkizler | common | Tekrar eden her harf çifti için +15 Çip. |
| Cimri | uncommon | 3 harf ve altı kelimeler ×3 Çarpan; uzunlar ×1. |
| Uyumlu | rare | Tüm sesliler ünlü uyumuna uyuyorsa ×2 Çarpan. |
| Mimar | uncommon | 6+ harfli kelime: harf sayısı × 8 Çip. |
| Stratejist | uncommon | Hiç harf atmadan körü geçersen sonraki körde ×2 Çarpan. |
| Köşe Taşı | common | Kelimenin ilk ve son harfi aynıysa +30 Çip. |

**Çılgın / kaos jokerleri (Balatro tadında patlama):**

| İsim | Nadirlik | Etki |
|------|----------|------|
| Kumarbaz | uncommon | Her kelimede %50 ihtimalle ×2 Çarpan, %50 hiçbir şey. |
| Kopyacı | rare | Hemen sağındaki jokerin etkisini kopyalar. |
| Harf Simyacısı | rare | Oynadığın her 'A' kalıcı olarak bu jokere +1 Çarpan ekler (run boyunca büyür). |
| Borsa | uncommon | Paran her 4 birim için +1 Çarpan (tur başında hesaplanır). |
| İntikam | common | Attığın her harf, sıradaki kelimene +5 Çip. |
| Palindrom Tanrısı | legendary | Palindrom kelime: ×20 Çarpan. |
| Anagram Şeytanı | rare | Daha önce oynadığın bir kelimenin anagramını oynarsan ×3 Çarpan. |
| Kâhin | rare | Destedeki sıradaki harfi görürsün; o harf J/Ğ ise bu tur ×4 Çarpan. |
| Sonsuz | legendary | Tur skoru 1000'i geçince kalan kelimelerde ×3 Çarpan. |
| Türkçe Belası | uncommon | 8+ harfli kelime: +100 Çip ve +8 Çarpan. |
| Joker Joker | rare | Her körün başında rastgele başka bir jokerin etkisini taklit eder. |
| Çığ | uncommon | Üst üste her geçilen körde kalıcı +1 Çarpan (kaybedince sıfırlanır). |
| Simbiyoz | rare | Her sesli için +3 Çip, her sessiz için +1 Çarpan. |

> Bu liste **başlangıç içeriği**. Hedef: 60-100+ joker. Hepsi yukarıdaki veri modelini
> kullanır, böylece içerik eklemek mimariyi değiştirmez.

> **Kodlanmış jokerler (16):** strateji 10'u (Sesli Avcısı, İkizler, Köşe Taşı, Cimri,
> Mimar, Türkçe Belası, Zincir, Kumarbaz, Simbiyoz, Borsa) + risk/kaos 6'sı (Palindrom
> Tanrısı ×20, Harf Simyacısı [run boyu büyür], Anagram Şeytanı ×3, Sonsuz, İntikam,
> Çığ). Kalıcı-büyüyen jokerler durumlarını run'a-özel `state.run.jokerVars`'ta tutar
> (joker nesnesi paylaşılan referans olduğundan ona yazmak run'lar arası sızdırır).

---

## 5. Patron Tur Kısıtlamaları (Boss Modifiers) ✅ KODLANDI

Her bölümün son turu (Patron) oyuncuyu motorunu farklı kullanmaya **zorlar** — zorluğun
zirvesi. `data/bosses.js`'te VERİ-GÜDÜMLÜ; Patron turunda seed'li rng ile bir tanesi seçilir.

**Veri modeli (joker'e benzer ama 3 kancası var):**
- `onStart(state)` — tur başında bir kez (hak/değişim kıs, harf kilitle…)
- `validate(cards, state) → {ok, reason}` — kelime oynanmadan ÖNCE blok (hak harcanmaz)
- `hooks.onWordScored(ctx)` — skorlama sırasında ceza (jokerlerden SONRA çalışır)

**Kodlanmış 7 patron:**
- **Uzun Yol:** kelime en az 5 harf (`validate`).
- **Tekel:** aynı harf 2'den fazla kullanılamaz (`validate`).
- **Açgözlü:** değişim (atma) hakkı yok (`onStart`).
- **Darboğaz:** bir kelime hakkı eksik (`onStart`).
- **Kısırlık:** ilk oynanan kelime 0 puan (`onWordScored`).
- **Vergi:** her kelimede çarpan ×0.5 (`onWordScored`).
- **Sansür:** rastgele 3 ünsüz kilitli — sesliler hep açık kalır ki el oynanabilsin
  (`onStart` kilitler, `validate` bloklar).

Aktif kısıtlama sol panelde kırmızı uyarı kutusunda + tur başında mesajda gösterilir.
(Not: "Sessizlik" Türkçe'de neredeyse her kelimede sesli olduğundan elendi; yerine
Darboğaz/Vergi geldi.)

---

## 6. Görsel Stil — "Mürekkep & Parşömen" (özgün tasarım dili)

> Amaç: Balatro'nun *hissini* yakalamak (koyu, dokulu, tok kartlar; büyük animasyonlu
> skor) ama **Balatro'ya benzemeyen, bize özel** bir kimlik. Yeşil keçe yerine **koyu
> indigo + çizgili kâğıt dokusu**, krem yerine **parşömen** kartlar, **mürekkep-mavisi +
> mum-kırmızısı + altın** vurgu. Edebi/kütüphane hissi. (Kullanıcı tercihi, 2026-06-12.)
> Pixel font: **Jersey 10** (`assets/fonts/Jersey10-Regular.ttf`, tam Türkçe). Kart
> harfleri okunurluk için Arial Black'te kalır.

### 6.1 Palet (CSS değişkenleri — `style.css` :root ile senkron)

```css
:root {
  --bg-deep:    #11142a;  /* en koyu indigo zemin */
  --bg-felt:    #1b1f3a;  /* masa indigo */
  --card-face:  #efe3c8;  /* parşömen kart yüzeyi */
  --card-edge:  #16142e;  /* mürekkep/koyu kenar */
  --chips:      #2f5fa6;  /* çip = mürekkep mavisi */
  --mult:       #c0492f;  /* çarpan = mum kırmızısı */
  --gold:       #d9a441;  /* para/altın vurgu */
  --good:       #4f9d6b;  /* geçerli (yeşil mürekkep) */
  --text:       #f3ead2;  /* parşömen yazı */
}
```

### 6.2 Kartlar

- Kalın koyu kenarlık, hafif iç gölge, krem yüzey. Köşeler yuvarlatılmış.
- **Tok ve fiziksel** hissetmeli: hover'da hafif yukarı kalkma + büyüme, oynayınca
  "snap" animasyonu, eldeki harfler hafif yelpaze gibi eğimli dizilir.
- Seçili harf belirgin şekilde yukarı çıkar.

### 6.3 Skor Okuması (merkez)

- Büyük, tok yazı tipi (chunky display font). **Çip mavi**, **çarpan kırmızı**,
  aralarında `×` işareti.
- Kelime oynanınca sayılar **tek tek tıklayarak yukarı sayar** (count-up animasyonu),
  her harf sırayla "pop" yapar. Sonuç skoru büyüyerek belirir.
- Gerilim hissi: çip ve çarpan ayrı ayrı dolar, sonra çarpılır.

### 6.4 Juice (oyun hissi)

- Büyük skorlarda hafif ekran sarsıntısı + parçacık patlaması.
- Hover/tık ses efektleri; kelime onayında tatmin edici "chunk" sesi.
- Joker tetiklendiğinde joker kartı titrer/parlar.
- CSS transition + `requestAnimationFrame`; ağır parçacıklar için küçük bir canvas
  katmanı (DOM üstünde) yeterli.

### 6.5 Düzen

```
┌───────────────────────────────────────────────┐
│  [Joker1][Joker2][Joker3][Joker4][Joker5]      │ ← üst: joker rafı
│                                                 │
│        ÇİP 124  ×  ÇARPAN 9                      │ ← merkez: skor okuması
│        Hedef: 600 / Skor: 0                      │
│                                                 │
│   [Harf][Harf][Harf][Harf][Harf][Harf][Harf]   │ ← alt: el (yelpaze)
│   [OYNA]  [ATMA]   Hak: 4   Atma: 3              │
└───────────────────────────────────────────────┘
```

---

## 7. Teknik Mimari

### 7.1 Stack

- **Başlangıç:** Saf HTML + CSS + JavaScript (ES modülleri). Build adımı yok —
  `index.html` aç, çalışır. Yeni başlayan için sürtünme sıfır.
- **Büyüyünce (opsiyonel, Aşama 7+):** Vite (hızlı dev sunucu + bundling). Hâlâ
  vanilla JS; framework şart değil.
- **Çizim:** Kartlar ve UI → DOM + CSS (kolay, erişilebilir). Parçacık/efektler →
  küçük bir `<canvas>` katmanı.

### 7.2 Altın Kural: Mantık ile Görseli Ayır

> **En önemli mimari ilke.** Oyun mantığı DOM'a *hiç* dokunmamalı.

```
src/
  engine/            ← saf oyun mantığı (DOM yok, test edilebilir)
    state.js         ← tek doğruluk kaynağı (game state objesi)
    scoring.js       ← chips/mult hesabı, hook çalıştırma sırası
    deck.js          ← deste, çekme, karıştırma
    round.js         ← kör/ante akışı, hedef kontrolü
    economy.js       ← para, faiz, ödül
    dictionary.js    ← Türkçe sözlük yükleme + kelime doğrulama
  data/              ← saf veri (içerik buradan eklenir)
    letterValues.js
    letterBag.js     ← başlangıç deste dağılımı
    jokers.js
    bosses.js
    vouchers.js
  render/            ← görsel katman (DOM/CSS/canvas)
    renderHand.js
    renderJokers.js
    renderScore.js
    renderShop.js
    animations.js
    particles.js
  audio/
    sfx.js
  main.js            ← her şeyi bağlar: input → engine → render
index.html
style.css
data/kelimeler.txt   ← Türkçe sözlük (geliştirici sağlar)
```

Akış: **Kullanıcı girişi → engine state'i günceller → render state'i okuyup çizer.**
Engine, neyin nasıl çizildiğini bilmez. Bu sayede mantığı bozmadan görseli
değiştirebilir, mantığı test edebilirsin.

### 7.3 State Objesi (tek doğruluk kaynağı)

```js
const state = {
  run: {
    ante: 1,
    money: 4,
    deck: [],          // harf objeleri (geliştirmeleriyle)
    jokers: [],        // sıralı joker listesi (soldan sağa)
    vouchers: [],
    seed: "...",       // tekrar-üretilebilir RNG için
  },
  round: {
    boss: null,
    target: 300,
    score: 0,
    playsLeft: 4,
    discardsLeft: 3,
    hand: [],          // eldeki harfler
    lastWordLength: 0,
    wordsPlayed: [],
  },
  config: { handSize: 8, basePlays: 4, baseDiscards: 3 },
};
```

### 7.4 Hook (Kanca) Sistemi — Jokerlerin Sırrı

Skorlama, joker ve patron efektlerini olaylar üzerinden çalıştırır. 150 joker eklemek
istediğinde bile `scoring.js` değişmez:

```js
function runHooks(eventName, ctx) {
  for (const joker of state.run.jokers) {     // soldan sağa
    joker.hooks?.[eventName]?.(ctx);
  }
  state.round.boss?.hooks?.[eventName]?.(ctx);
}
```

`ctx` içindeki `addChips()`, `addMult()`, `xMult()` yardımcılarıyla jokerler skoru
güvenli şekilde değiştirir.

### 7.5 Türkçe Sözlük / Veri (geliştirici sağlar)

Geliştirici `data/kelimeler.txt` dosyasını sağlar. Beklenen format:

- Her satırda bir kelime, **küçük harf**, UTF-8, Türkçe karakterler korunmuş.
- Kod bunu bir `Set`'e yükler → O(1) kelime kontrolü.

**KRİTİK — Türkçe büyük/küçük harf tuzağı:** JavaScript'in `toLowerCase()`'i Türkçe
i/İ/ı/I'yı yanlış yapar. Her zaman `toLocaleLowerCase('tr-TR')` /
`toLocaleUpperCase('tr-TR')` kullan. Doğrulamadan önce kelimeyi locale-bilinçli
normalize et. Bu, sessiz hata kaynağı #1 olur.

### 7.6 RNG / Seed

Tüm rastgelelik tek bir seed'li RNG'den gelmeli (deste karıştırma, dükkân, "Kumarbaz"
jokeri). Böylece run tekrar-üretilebilir olur, hata ayıklanır ve "daily seed" eklenebilir.

### 7.7 Akıllı Dağıtıcı (AI) — `engine/dealer.js`

"Mantıklı harfler gelsin" hedefi. **LLM değil**; hızlı, çevrimdışı, **seed'li** (yani
deterministik) bir sezgisel arama. Bir el dağıtılırken:

- Pool'dan birkaç aday el dener (her deneme `run.rng`'yi ilerletir → deterministik).
- Her elin **kalitesini** puanlar: kaç farklı geçerli kelime kurulabilir (sözlüğün
  harf-sayım imzalarıyla, sıra-bağımsız multiset kontrolü) + sesli oranı hedefe yakınlık.
- En iyi eli seçer; yeterince iyiyse (≥`minWords` kelime, sesli oranı toleransta) erken durur.

Ayarlar `data/config.js` → `dealer`. Aynı seed = aynı eller. Bir LLM (Claude API) bunu
yapsaydı seed tekrar-üretilebilirliği bozulur, gecikme/maliyet eklenirdi — bu yüzden
dağıtım algoritmiktir. (LLM ileride yalnızca opsiyonel "ipucu" için düşünülebilir.)

---

## 8. Geliştirme Planı (Aşamalar)

> Her aşama **oynanabilir bir şey** üretmeli. Önce çalışsın, sonra güzelleşsin.
> Bir aşama bitmeden sonrakine geçme.

**Aşama 0 — Kurulum (yarım gün) ✅ BİTTİ**
`index.html`, `style.css`, klasör yapısı. Engine/render ayrımı baştan kurulu.
Çalıştırma: yerel sunucu (`python3 -m http.server`) — ES modülleri + sözlük `fetch`
`file://`'de çalışmadığı için. Sözlük: 63.583 kelime (`data/kelimeler.txt`).

**Aşama 1 — Çekirdek Döngü MVP ✅ BİTTİ**
Deste oluştur → 8 harf çek → kelime kur → sözlükle doğrula → `chips × mult` → hedef.

**Aşama 2 — Tur Yapısı ✅ BİTTİ**
Kelime/atma hakkı + harf tutma. Çok kör (küçük→büyük→patron), `data/blinds.js`, artan
hedef eğrisi (`targetBase × anteGrowth^ante × blindMult`), ante ilerleme, kazan/kaybet
ve "kör geçildi → ödül" ekranları (`engine/economy.js`). Ekstra olarak öne çekildi:
- **Kelime uzunluğu kademeleri** (`data/wordTiers.js`) — skor dengesi (bkz. 3.2).
- **Akıllı dağıtıcı / AI** (`engine/dealer.js`) — bkz. 7.7.
- **Sürükle-bırak kelime alanı** + **juice** (count-up skor, +skor balonu, ekran
  sarsıntısı; `render/animations.js`). Tam görsel/ses cilası yine Aşama 7'de derinleşir.

**Aşama 3 — Joker Sistemi ✅ BİTTİ**
Hook sistemi canlı (`engine/hooks.js` tetiklenen jokeri kaydeder). **10 başlangıç jokeri**
(`data/jokers.js`) veri-güdümlü skorlamayla çalışır; `engine/jokerActions.js` ekle/çıkar/
yeniden-sırala sağlar. Dükkân yok — **"+Joker (test)"** butonuyla rastgele joker verilir,
joker kartına tıklayınca çıkar, sürükleyerek yeniden sıralanır. Joker rafında gerçek
kartlar (ikon + ipucu/tooltip), tetiklenince **parıltı animasyonu**. Canlı önizlemede
rastgele jokerler (Kumarbaz) pas geçer (`scoreWord(..., {preview:true})`).
Ek görsel: **pixel-art kimliği** (Pixelify Sans, `assets/fonts/`), büyütülmüş kartlar,
**desteden geliş (deal-in) animasyonu**, keçe dokusu, buton aralığı düzeltildi.

**Aşama 4 — Dükkân & Ekonomi ✅ BİTTİ**
Körler arası **dükkân** (`engine/shop.js`, `render/renderShop.js`): joker **satın al**
(maliyet + açıklama görünür), **sat** (maliyetin yarısı), **reroll** (artan maliyet),
**harf paketi** (3 harf arası seç → desteye kat), **kupon** (`data/vouchers.js` — kalıcı
config yükseltmeleri: +el boyutu / +hak / +atma / +faiz tavanı). Akış: kör geç → ödül
topla (`collectBlindReward`) → dükkân → "Sonraki Kör" (`proceedToNextBlind`). Para sadece
gösterim değil artık harcanıyor. Joker kartlarında her zaman görünür açıklama.
Kart harfleri okunurluk için kalın-net fonta alındı (pixel kimliği HUD'da kalır).

**Aşama 5 — Deste Kurma & Harf Geliştirmeleri**
Desteye harf ekle/çıkar, foil/holo/poly vb. geliştirmeler.

**Aşama 6 — Bölüm & Patron Turlar** 🔶 KISMEN
Tam run yapısı (8 bölüm) ve kuponlar zaten var. **Patron kısıtlamaları KODLANDI** (7 adet,
`data/bosses.js` — bkz. Bölüm 5; veri-güdümlü onStart/validate/onWordScored). Kalan: daha
fazla patron çeşidi, bölüm-özel patron havuzu, ante-bazlı zorluk ince ayarı (Aşama 8).

**Aşama 7 — Görsel & Juice (Balatro hissi)** 🔶 KISMEN (öne çekildi)
Animasyonlar, count-up skor, parçacıklar, ekran sarsıntısı, ses. Vanilla yetmezse
Vite'a geç. **Yapıldı (dopamin geçişi):**
- **Sıralı skor çözümü** — Balatro'nun "tek tek sayma" anı. Engine (`scoring.js`+
  `hooks.js`) saf veri `timeline` üretir (her harf/kademe/joker katkısı, sırayla);
  `render/scoreSequence.js` adım adım oynatır: harf pop → joker tetik + uçan sayı →
  çip×çarpan çarpışması.
- **Parçacık katmanı** (`render/particles.js`) — canvas patlama + konfeti.
- **Yükselen ödül** — skor/hedef oranına göre "SÜPER!/MUHTEŞEM!/İNANILMAZ!" banner'ı,
  artan sarsıntı + parçacık + (dev skorda) konfeti.
- **Oyun kabuğu (profesyonelleşme):** ana menü (OYNA/Nasıl Oynanır/Ayarlar), **Ayarlar**
  (animasyon hızı, sarsıntı, parçacık aç/kapa — `localStorage`'da kalıcı), **Nasıl Oynanır**
  ekranı. Sidebar'da "☰ Menü" ile her an erişilir. Tümü `index.html` overlay + `main.js`.
- **Özgün tasarım dili** — "Mürekkep & Parşömen" (bkz. Bölüm 6) + Jersey 10 font.
- **Terminoloji:** poker "kör" dili kaldırıldı → **Bölüm** (=ante) · **Tur 1/Tur 2/Patron**
  (=küçük/büyük/patron kör). Motor `type` alanları (small/big/boss) DEĞİŞMEDİ; sadece
  görünen adlar. Bu doküman ve sözlükteki "kör/ante" sözcükleri bu eşlemeyle okunmalı.
- **UI metin temizliği:** "ATMA" butonu ("atma!" = *sakın atma* gibi okunuyordu) → **DEĞİŞTİR**;
  sayaç "Atma" → **Değişim**; "En az X skorla" → **Hedef X**. (Mantıksız/ters-anlamlı metinler.)
- **Menü kimliği:** arkada süzülen parşömen harf taşları (kelime-oyunu hissi, Balatro değil).
- **Tahta yeniden tasarımı:** etiketli joker rafı ("JOKERLER n/5"), "KELİMENİ KUR" başlıklı
  geniş parşömen oyun alanı, geçerli kelimede **yeşil hazır parıltısı** (`play-area--ready`),
  el + deste hizalı alt sıra. Eski seyrek/boş düzen gitti.
- **Yaşayan arka plan:** yavaş süzülen "mürekkep yıkaması" (`ink-wash` animasyonu — özgün,
  Balatro'nun girdabı DEĞİL).
- **Run özeti ekranı:** kazanma/kaybetme overlay'inde istatistik paneli (Ulaşılan Bölüm,
  En iyi kelime, Oynanan kelime, Kalan para). `state.run.stats` engine'de tutulur.
- **Zorluk:** `anteGrowth` 1.6 → **1.8** (geç bölümler motor büyütmeyi zorlar) + Patron debuff'ları.
  Hâlâ kazanılabilir; ince denge Aşama 8 playtest.
Kalan: ses efektleri (`audio/sfx.js`), dükkân/deste juice'u, tam denge (Aşama 8).

**Aşama 8 — Denge & İçerik**
Joker sayısını büyüt (60+), hedef eğrisini ayarla, run'ları test et, denge.

**Aşama 9 — (Opsiyonel) Godot Portu**
Mantık (engine/) zaten saf ve taşınabilir olduğundan, sadece render katmanı yeniden
yazılır. Web sürümü "tasarım kanıtı" olarak kalır.

---

## 9. AI Asistanı İçin Kurallar

Bu projede kod yazarken:

1. **Mantık/görsel ayrımını asla bozma.** `engine/` ve `data/` DOM'a dokunmaz.
2. **İçerik veri olmalı.** Yeni joker/patron/harf = `data/` içine bir obje. Skorlama
   mantığına `if (joker.id === "...")` yazma.
3. **Önce çalışan en küçük şey.** Bir aşamanın MVP'sini bitir, sonra cila.
4. **Türkçe karakterlerde her zaman `'tr-TR'` locale'i kullan** (büyük/küçük harf).
5. **Tüm rastgelelik seed'li RNG'den.** `Math.random()` doğrudan kullanma.
6. **Sabitleri data/config'e koy** (el boyutu, hak sayısı, çip değerleri). Sihirli sayı yok.
7. **Küçük, okunur fonksiyonlar.** Geliştirici kod bilmiyor; isimler ve yapı kendini
   anlatmalı. Karmaşık bölümleri Türkçe yorumla açıkla.
8. **Bir şey eklemeden önce** bu dosyadaki ilgili bölümü oku; tasarımla çelişme.
9. Belirsizlik varsa **varsay ve devam etme** — geliştiriciye sor.

---

## 10. Sözlük (Glossary)

- **Run:** Tek bir oyun denemesi (kaybedince/bitince biter).
- **Ante:** Zorluk seviyesi; 3 körden oluşur.
- **Kör (blind):** Tek bir skor hedefi (küçük / büyük / patron).
- **Çip (chips):** Skorun toplama kısmı.
- **Çarpan (mult):** Skorun çarpma kısmı.
- **El (hand):** O an oynanabilir harfler.
- **Kelime hakkı (plays):** Tur başına oynanabilir kelime sayısı.
- **Atma hakkı (discards):** Harf değiştirme hakkı.
- **Joker:** Skorlamayı değiştiren kalıcı kart (motor parçası).
- **Hook:** Bir olayda (kelime oynanınca vb.) çalışan joker fonksiyonu.
- **Deste (deck):** Oyuncunun harf havuzu; run boyunca şekillenir.
- **Geliştirme (enhancement):** Tek bir harfe takılan efekt (foil, holo vb.).
- **Dükkân (shop):** Körler arası satın alma ekranı.

---

*Son güncelleme: v1 taslak. Tasarım geliştikçe bu dosya güncellenir — kod değil, bu
dosya tek doğruluk kaynağıdır.*