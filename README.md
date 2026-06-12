# Wordtro — Harf Destesi

Türkçe kelime-roguelike (deckbuilder). *Kelimelik × Balatro.*
Tasarımın tam referansı: [`CLAUDE.md`](./CLAUDE.md).

## Çalıştırma

ES modülleri ve sözlük `fetch` ile yüklendiği için tarayıcı `file://` üzerinden
**çalışmaz** — küçük bir yerel sunucu gerekir (kurulum/build yok):

```bash
python3 -m http.server 8000      # veya: npm run serve
# tarayıcıda aç:  http://localhost:8000
```

## Nasıl oynanır (Aşama 3)

1. Eldeki harfleri **sürükle** (veya tıkla) → ortadaki **kelime alanına** diz.
   Sol paneldeki kutu canlı **çip × çarpan** gösterir; kelime geçerliyse yeşil yanar.
2. **OYNA** → Türkçe sözlükle doğrulanır, skorlanır (count-up + ekran sarsıntısı +
   tetiklenen joker parıltısı).
3. **ATMA** → seçili harfleri havuza atıp yenisini çek (hak harcamaz).
4. Her körde **hedef skoru** geç: küçük → büyük → patron. Patronu geçince **ante** artar.
5. 8 anteyi geçersen kazanırsın; bir hedefi tutturamazsan run biter.

**Jokerler:** Skorun motoru (`data/jokers.js`). Henüz dükkân yok — **"+Joker (test)"**
butonuyla rastgele joker ekle, joker kartına **tıklayınca çıkar**, **sürükleyerek**
yeniden sırala (sıra önemli). Run 2 jokerle başlar.

**Skor = çip × çarpan.** Çarpan kelime uzunluğu kademesinden gelir (4–5 harf ×2, 6–7 ×3,
8+ ×4); jokerler bunun üstüne biner — uzun kelime + doğru joker = patlama.

## Mimari (CLAUDE.md 7.2 — mantık/görsel ayrımı)

```
src/
  engine/   saf mantık, DOM YOK
    rng · dictionary · deck · dealer(AI) · scoring · hooks · jokerActions · economy · round · state
  data/     saf veri
    config · letterValues · letterBag · wordTiers · blinds · jokers
  render/   görsel katman (DOM)
    renderSidebar · renderHand · renderBoard · renderJokers · renderDeck · animations
  main.js   girdi (sürükle-bırak/tıklama) → engine → render
assets/fonts/PixelifySans.ttf   pixel-art font (Türkçe destekli, OFL)
data/kelimeler.txt   Türkçe sözlük (63.583 kelime, tr-TR normalize)
scripts/
  smoke-test.mjs     engine mantık testi:   node scripts/smoke-test.mjs
  browser-test.mjs   gerçek tarayıcı testi (CDP):  node scripts/browser-test.mjs
```

**Akıllı dağıtıcı (AI):** `engine/dealer.js` — her el kelime kurulabilir harfler içerir
(sesli/sessiz dengeli), seed'li ve deterministik. LLM değil; hızlı ve çevrimdışı.

Kurallar: tüm rastgelelik seed'li RNG'den, Türkçe büyük/küçük harf hep `tr-TR` locale ile,
içerik (harf değerleri, kademeler, körler) veri olarak.

Sözlük kaynağı: [CanNuhlar/Turkce-Kelime-Listesi](https://github.com/CanNuhlar/Turkce-Kelime-Listesi).
