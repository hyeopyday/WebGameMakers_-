// FILE: src/type/difficulty.ts

// 1=Normal, 2=Hard, 3=Hell
import type { Mode } from "./numberBaseball";

export interface DifficultySpec {
  name: "Normal" | "Hard" | "Hell";
  playerMaxHP: number; // 플레이어 체력
  chaserSpeed: number; // 체이서 이동속도 (타일/초)
  runnerSpeed: number; // 러너 이동속도 (타일/초)
  chaserCount: number; // 체이서 개체수
}

const TABLE: Record<Mode, DifficultySpec> = {
  1: {
    name: "Normal",
    playerMaxHP: 3,
    chaserSpeed: 1.0,
    runnerSpeed: 1.0,
    chaserCount: 2,
  },
  2: {
    name: "Hard",
    playerMaxHP: 2,
    chaserSpeed: 1.95,
    runnerSpeed: 1.9,
    chaserCount: 3,
  },
  3: {
    name: "Hell",
    playerMaxHP: 1,
    chaserSpeed: 3.0,
    runnerSpeed: 2.1,
    chaserCount: 4,
  },
};

const STORAGE_KEY = "game.difficulty.mode";
export const DIFFICULTY_CHANGED = "difficulty-changed";

function readInitialMode(): Mode {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const m = raw ? Number(raw) : 1;
    if (m === 1 || m === 2 || m === 3) return m as Mode;
  } catch {}
  return 1;
}




// test
// ✅ 초기화를 한 번만 수행
const initialMode = readInitialMode();

const state = {
  mode: initialMode,
  spec: TABLE[initialMode],
};

export function setDifficulty(mode: Mode): void {
  const next = mode === 1 || mode === 2 || mode === 3 ? mode : 1;
  state.mode = next;
  state.spec = TABLE[next];

  console.log(`🎮 [Difficulty] setDifficulty(${next}) 호출됨 - ${state.spec.name}`);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DIFFICULTY_CHANGED, { detail: { mode: next, spec: state.spec } }));
    console.log(`🎮 [Difficulty] DIFFICULTY_CHANGED 이벤트 발생`);

    // ✅ 체력 리셋 + 적 재배치 이벤트 추가
    window.dispatchEvent(new Event("reset-hp"));
    window.dispatchEvent(new Event("reposition-mobs"));
  }
}

export function getDifficulty(): DifficultySpec {
  return state.spec;
}

export function getMode(): Mode {
  return state.mode;
}

// ✅ Proxy를 통해 항상 최신 spec 반환
export const DIFFICULTY = new Proxy({} as DifficultySpec, {
  get(_: DifficultySpec, p: keyof DifficultySpec) {
    const value = state.spec[p];
    return value;
  },
}) as DifficultySpec;

export const ModeMap = {
  normal: 1 as Mode,
  hard: 2 as Mode,
  hell: 3 as Mode,
};
