// Paylaşılan SAF oyun mantığı (../src/engine, ../src/data) JS'tir ve DOKUNULMAZ.
// Bu dosya, mobil UI'ın tükettiği public yüzeyi tipler — engine'i tiplemeden.
// (CLAUDE.md 7.2: mantık/görsel ayrımı; tipler yalnızca UI tarafında.)

// ── Çekirdek veri biçimleri ────────────────────────────────────────────────
export interface Card {
  id: number;
  char: string;
  enhancements: string[];
}

export interface Joker {
  id: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  cost: number;
  description: string;
  icon?: string;
  hooks?: Record<string, (ctx: any) => void>;
}

export interface Blind {
  type: "small" | "big" | "boss";
  name: string;
  mult: number;
  reward: number;
}

export interface Boss {
  id: string;
  name: string;
  description: string;
  onStart?: (state: GameState) => void;
  validate?: (cards: Card[], state: GameState) => { ok: boolean; reason?: string };
  hooks?: Record<string, (ctx: any) => void>;
}

export interface RunState {
  ante: number;
  blindIndex: number;
  money: number;
  deck: Card[];
  deckSize: number;
  jokers: Joker[];
  jokerVars: Record<string, number>;
  stats: { words: number; bestWord: string; bestScore: number };
  vouchers: any[];
  shop: ShopState | null;
  boosterChoices: string[] | null;
  nextCardId: number;
  seed: string;
  rng: () => number;
  status: "playing" | "won" | "lost";
}

export interface RoundState {
  blind: Blind | null;
  boss: Boss | null;
  lockedChars: Set<string> | null;
  target: number;
  score: number;
  playsLeft: number;
  discardsLeft: number;
  pool: Card[];
  hand: Card[];
  lastWordLength: number;
  wordsPlayed: string[];
  status: "playing" | "won" | "lost";
  lastReward: Reward | null;
  rewardCollected: boolean;
}

export interface GameConfig {
  handSize: number;
  basePlays: number;
  baseDiscards: number;
  minWordLength: number;
  maxAnte: number;
  targetBase: number;
  anteGrowth: number;
  startMoney: number;
  dictionaryUrl: string;
  [k: string]: any;
}

export interface GameState {
  run: RunState;
  round: RoundState;
  config: GameConfig;
}

export interface TimelineStep {
  kind: "letter" | "tier" | "joker" | "boss";
  char?: string;
  label?: string;
  name?: string;
  icon?: string;
  id?: string;
  base?: number;
  ops: { op: "chip" | "mult" | "xmult"; n: number }[];
  chips: number;
  mult: number;
}

export interface ScoreResult {
  chips: number;
  mult: number;
  score: number;
  timeline: TimelineStep[];
  tier: { label: string; bonusChips: number; mult: number };
  firedJokers: string[];
}

export interface PlayResult extends Partial<ScoreResult> {
  ok: boolean;
  reason?: string;
  word?: string;
}

export interface Reward {
  base: number;
  leftover: number;
  interest: number;
  total: number;
}

export interface ShopState {
  jokers: Joker[];
  booster: { id: string; name: string; cost: number; used: boolean };
  voucher: any | null;
  rerollCost: number;
}

// ── Modül bildirimleri ─────────────────────────────────────────────────────
declare module "@engine/state" {
  export function createState(seed?: string): GameState;
}
declare module "@engine/round" {
  export function startRun(state: GameState): void;
  export function startBlind(state: GameState): void;
  export function currentBlind(state: GameState): Blind;
  export function playWord(state: GameState, selectedIds: number[]): PlayResult;
  export function discardCards(state: GameState, selectedIds: number[]): { ok: boolean; reason?: string };
  export function collectBlindReward(state: GameState): Reward | null;
  export function proceedToNextBlind(state: GameState): { runWon: boolean };
  export function advanceBlind(state: GameState): { ok: boolean; reward?: Reward; runWon?: boolean };
}
declare module "@engine/scoring" {
  export function scoreWord(state: GameState, cards: Card[], opts?: { preview?: boolean }): ScoreResult;
}
declare module "@engine/dictionary" {
  export function loadDictionaryFromText(text: string): number;
  export function loadDictionary(url: string): Promise<number>;
  export function isValidWord(word: string, minLen?: number): boolean;
  export function isDictionaryLoaded(): boolean;
  export function normalizeWord(word: string): string;
  export function getWordSet(): Set<string>;
}
declare module "@engine/jokerActions" {
  export const MAX_JOKERS: number;
  export function addJoker(state: GameState, joker: Joker): boolean;
  export function addJokerById(state: GameState, id: string): boolean;
  export function removeJoker(state: GameState, id: string): void;
  export function addRandomJoker(state: GameState): Joker | null;
  export function moveJoker(state: GameState, id: string, toIndex: number): void;
}
declare module "@engine/shop" {
  export function generateShop(state: GameState): ShopState;
  export function reroll(state: GameState): { ok: boolean };
  export function buyJoker(state: GameState, jokerId: string): { ok: boolean; reason?: string; joker?: Joker };
  export function sellJoker(state: GameState, jokerId: string): { ok: boolean; value?: number };
  export function buyBooster(state: GameState): { ok: boolean; reason?: string; choices?: string[] };
  export function chooseBoosterLetter(state: GameState, char: string): { ok: boolean };
  export function buyVoucher(state: GameState): { ok: boolean; reason?: string; voucher?: any };
}
declare module "@engine/turkishCase" {
  export function trLower(str: string): string;
}
declare module "@data/config" {
  export const CONFIG: GameConfig;
}
declare module "@data/jokers" {
  export const JOKERS: Joker[];
  export function jokerById(id: string): Joker | undefined;
}
declare module "@data/letterValues" {
  export function letterChips(char: string): number;
  export const LETTER_VALUES: Record<string, number>;
}
