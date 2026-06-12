// React-yüzü tek kap (zustand). Engine `state`'i YERİNDE mutasyona uğratır →
// React bunu göremez. Çözüm: engine her değiştiğinde `version`'ı artır (bump);
// bileşenler `version`'a abone olup mutasyon sonrası state'i yeniden okur.
// (CLAUDE.md 7.2/7.3: engine saf kalır, store sadece render tetikler.)

import { create } from "zustand";
import type { GameState } from "../types/engine";

// Canlı önizleme (kelime dizilirken sidebar'da gösterilen taban skor).
export interface Preview {
  chips: number;
  mult: number;
  score: number;
  word: string;
  valid: boolean;
}

export interface UiState {
  word: number[]; // dizilen kart id'leri (sıra önemli)
  message: string;
  preview: Preview | null;
  firedJokers: string[]; // son kelimede tetiklenen jokerler (görsel)
  // Son oynanan kelimenin FX verisi (uçan +skor / count-up / sarsıntı tetiği).
  // seq her oynamada artar → aynı skor olsa bile animasyon yeniden tetiklenir.
  lastPlay: { score: number; chips: number; mult: number; hype: number; seq: number } | null;
}

export type Screen = "menu" | "game";

interface GameStore {
  state: GameState | null; // engine objesi (yerinde mutasyon)
  version: number; // mutasyon sonrası render tetiği
  ui: UiState;
  animating: boolean; // skor çözümü sürerken girişleri kilitle
  dictReady: boolean; // sözlük yüklendi mi
  started: boolean; // bir run başladı mı ("DEVAM ET" vs "OYNA")
  screen: Screen;

  bump(): void;
  setUi(patch: Partial<UiState>): void;
  setGame(s: GameState | null): void;
  set<K extends keyof GameStore>(key: K, value: GameStore[K]): void;
}

const EMPTY_UI: UiState = { word: [], message: "", preview: null, firedJokers: [], lastPlay: null };

export const useGameStore = create<GameStore>((set) => ({
  state: null,
  version: 0,
  ui: { ...EMPTY_UI },
  animating: false,
  dictReady: false,
  started: false,
  screen: "menu",

  bump: () => set((s) => ({ version: s.version + 1 })),
  setUi: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),
  setGame: (state) => set({ state }),
  set: (key, value) => set({ [key]: value } as any),
}));
