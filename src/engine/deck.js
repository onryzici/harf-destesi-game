// Deste: oluşturma, karıştırma, çekme — CLAUDE.md 7.2.
// Saf mantık, DOM yok. Rastgelelik daima dışarıdan verilen seed'li rng ile.

import { shuffle } from "./rng.js";

// Her harf bir "kart" objesidir. Aşama 1'de sadece harfi var; geliştirmeler
// (foil/holo vb.) Aşama 5'te buraya eklenecek — yapı şimdiden hazır.
// { id, char, enhancements: [] }

// Bag dağılımından ({A:5, ...}) kart listesi üretir.
export function buildDeck(bag) {
  const cards = [];
  let id = 0;
  for (const [char, count] of Object.entries(bag)) {
    for (let i = 0; i < count; i++) {
      cards.push({ id: id++, char, enhancements: [] });
    }
  }
  return cards;
}

// Desteden karıştırılmış bir çekme yığını (draw pile) üretir.
// Orijinal desteyi bozmaz (kopyalar).
export function makeDrawPile(deck, rng) {
  return shuffle([...deck], rng);
}

// Eli handSize'a tamamlayana kadar çekme yığınından kart çeker.
// drawPile'ın sonundan çeker (pop). Yığın biterse el eksik kalabilir.
export function refillHand(hand, drawPile, handSize) {
  while (hand.length < handSize && drawPile.length > 0) {
    hand.push(drawPile.pop());
  }
  return hand;
}
