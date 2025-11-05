// FILE: src/type/difficulty.ts
export type Mode = 1 | 2 | 3;

export interface DifficultyConfig {
  player: { hp: number; invincibleMs: number; vision: number };
  chaser: { speed: number; attackRange: number; cooldown: number; pathRecalc: number };
  runner: { speed: number; collideRadius: number; panicDist: number; escapeKeep: number };
}

export const DIFFICULTY: Record<Mode, DifficultyConfig> = {
  1: {
    player: { hp: 3, invincibleMs: 800, vision: 200 },
    chaser: { speed: 170, attackRange: 25, cooldown: 0.9, pathRecalc: 0.3 },
    runner: { speed: 175, collideRadius: 20, panicDist: 300, escapeKeep: 1280 },
  },
  2: {
    player: { hp: 2, invincibleMs: 650, vision: 180 },
    chaser: { speed: 185, attackRange: 28, cooldown: 0.75, pathRecalc: 0.26 },
    runner: { speed: 190, collideRadius: 18, panicDist: 340, escapeKeep: 1400 },
  },
  3: {
    player: { hp: 1, invincibleMs: 500, vision: 160 },
    chaser: { speed: 9999999, attackRange: 30, cooldown: 0.6, pathRecalc: 0.22 },
    runner: { speed: 205, collideRadius: 16, panicDist: 380, escapeKeep: 1550 },
  },
};

// 중앙에서 난이도 관리
export let CURRENT_MODE: Mode = 1;

// 난이도 설정 (MainMenu에서 호출)
export function setDifficulty(mode: Mode) {
  CURRENT_MODE = mode;
}

// 현재 난이도 반환 (Chaser 등에서 사용)
export function getCurrentMode(): Mode {
  return CURRENT_MODE;
}
