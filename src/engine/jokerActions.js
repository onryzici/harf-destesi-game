// Joker ekleme/çıkarma — saf mantık, DOM yok. Aşama 3: dükkân olmadığından
// jokerler debug/test ile elle verilir (CLAUDE.md Aşama 3).

import { JOKERS, jokerById } from "../data/jokers.js";

export const MAX_JOKERS = 5;

export function addJoker(state, joker) {
  if (!joker || state.run.jokers.length >= MAX_JOKERS) return false;
  state.run.jokers.push(joker);
  return true;
}

export function addJokerById(state, id) {
  return addJoker(state, jokerById(id));
}

export function removeJoker(state, id) {
  const i = state.run.jokers.findIndex((j) => j.id === id);
  if (i !== -1) state.run.jokers.splice(i, 1);
}

// Sahip olunmayan jokerlerden rastgele birini ekler (seed'li rng). Test için.
export function addRandomJoker(state) {
  if (state.run.jokers.length >= MAX_JOKERS) return null;
  const owned = new Set(state.run.jokers.map((j) => j.id));
  const pool = JOKERS.filter((j) => !owned.has(j.id));
  if (pool.length === 0) return null;
  const idx = Math.floor(state.run.rng() * pool.length);
  const joker = pool[idx];
  state.run.jokers.push(joker);
  return joker;
}

// Joker dizilimini yeniden sırala (soldan sağa strateji — CLAUDE.md 4.1).
export function moveJoker(state, id, toIndex) {
  const jokers = state.run.jokers;
  const from = jokers.findIndex((j) => j.id === id);
  if (from === -1) return;
  const [j] = jokers.splice(from, 1);
  let idx = Math.max(0, Math.min(toIndex, jokers.length));
  jokers.splice(idx, 0, j);
}
