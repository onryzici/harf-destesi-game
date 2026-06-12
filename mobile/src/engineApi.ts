// Paylaşılan SAF engine'e TEK tipli kapı (facade). Engine/data JS olduğundan
// GÖRELİ yolla (Metro bunu çözüp hash'liyor) ts-ignore ile içe alınır ve dışarıya
// TİPLİ yeniden-export edilir. Böylece mobil kod tek yerden, tip güvenli erişir;
// engine'e DOKUNULMAZ (CLAUDE.md 7.2). Alias/resolver hack'i gerekmez.

import type { GameState, Card, ScoreResult, PlayResult, Reward } from "../types/engine";

// shared/ = repo kökündeki src/{engine,data}'nın ÜRETİLMİŞ aynası (scripts/sync-shared.mjs).
// Buradan import — Metro proje kökü içini sorunsuz çözer. ASLA shared'ı elle düzenleme.
// @ts-ignore - JS modülü, tipler aşağıda cast ile veriliyor
import { createState as _createState } from "../shared/engine/state";
// @ts-ignore
import {
  startRun as _startRun,
  playWord as _playWord,
  discardCards as _discardCards,
  collectBlindReward as _collectBlindReward,
  proceedToNextBlind as _proceedToNextBlind,
} from "../shared/engine/round";
// @ts-ignore
import { scoreWord as _scoreWord } from "../shared/engine/scoring";
// @ts-ignore
import { loadDictionaryFromText as _loadDictionaryFromText, isValidWord as _isValidWord } from "../shared/engine/dictionary";
// @ts-ignore
import { letterChips as _letterChips } from "../shared/data/letterValues";

export const createState = _createState as (seed?: string) => GameState;
export const startRun = _startRun as (s: GameState) => void;
export const playWord = _playWord as (s: GameState, ids: number[]) => PlayResult;
export const discardCards = _discardCards as (s: GameState, ids: number[]) => { ok: boolean; reason?: string };
export const collectBlindReward = _collectBlindReward as (s: GameState) => Reward | null;
export const proceedToNextBlind = _proceedToNextBlind as (s: GameState) => { runWon: boolean };
export const scoreWord = _scoreWord as (s: GameState, cards: Card[], opts?: { preview?: boolean }) => ScoreResult;
export const loadDictionaryFromText = _loadDictionaryFromText as (text: string) => number;
export const isValidWord = _isValidWord as (word: string, minLen?: number) => boolean;
export const letterChips = _letterChips as (char: string) => number;
