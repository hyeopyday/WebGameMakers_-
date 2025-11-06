// FILE: src/type/difficulty.ts

// 1=Normal, 2=Hard, 3=Hell
import type { Mode } from "./numberBaseball";

export interface DifficultySpec {
  name: "Normal" | "Hard" | "Hell";
  playerMaxHP: number;      // 플레이어 체력
  chaserSpeed: number;      // 체이서 이동속도 (타일/초)
  runnerSpeed: number;      // 러너 이동속도 (타일/초)
  chaserCount: number;      // 체이서 개체수
}

/** 난이도 변경 브로드캐스트 이벤트 이름 (모듈 전역 상수로 고정) */
export const DIFFICULTY_CHANGED = "difficulty-changed";

/** 로컬스토리지 키 */
const STORAGE_KEY = "game:difficulty-mode";

/** 난이도 테이블: 1=보통, 2=어려움, 3=헬 */
const TABLE: Record<Mode, DifficultySpec> = {
  1: {
    name: "Normal",
    playerMaxHP: 3,
    chaserSpeed: 3.2,
    runnerSpeed: 3.5,
    chaserCount: 1,
  },
  2: {
    name: "Hard",
    playerMaxHP: 3,
    chaserSpeed: 5.7,
    runnerSpeed: 3.3,
    chaserCount: 1,
  },
  3: {
    name: "Hell",
    playerMaxHP: 2,
    chaserSpeed: 7.2,
    runnerSpeed: 8.6,
    chaserCount: 2,
  },
};

/** 내부 상태 */
type DiffState = {
  mode: Mode;
  spec: DifficultySpec;
};

const loadInitialMode = (): Mode => {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const n = raw ? Number(raw) : NaN;
    if (n === 1 || n === 2 || n === 3) return n as Mode;
  } catch {}
  return 1 as Mode; // 기본값: 보통
};

const initialMode = loadInitialMode();

const state: DiffState = {
  mode: initialMode,
  spec: TABLE[initialMode],
};

/** 현재 난이도 조회용 헬퍼 */
export type DiffSnapshot = Readonly<DiffState>;
export function getDifficulty(): DiffSnapshot {
  return { mode: state.mode, spec: state.spec };
}

/**
 * 난이도 변경
 * - 1=보통, 2=어려움, 3=헬만 허용
 * - 변경 시 DIFFICULTY_CHANGED 이벤트 발행
 * - 체력 초기화 및 적 재배치 이벤트도 함께 발행
 */
export function setDifficulty(next: Mode): void {
  // 유효 범위 보정
  const normalized = (next === 1 || next === 2 || next === 3) ? next : (1 as Mode);

  // 상태 갱신
  state.mode = normalized;
  state.spec = TABLE[normalized];

  // 영속화
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(normalized));
    }
  } catch {}

  // 브로드캐스트
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DIFFICULTY_CHANGED, { detail: { mode: state.mode } }));
    // 플레이어 HP/스폰 보정
    window.dispatchEvent(new Event("reset-hp"));
    // 적 재배치 보정
    window.dispatchEvent(new Event("reposition-mobs"));
  }
}

/**
 * DIFFICULTY: 항상 최신 사양을 노출하는 읽기용 프록시
 * - 소비측(캐릭터/적 AI)은 기존처럼 DIFFICULTY.playerMaxHP 등으로 접근
 */
export const DIFFICULTY = new Proxy({} as DifficultySpec, {
  get(_: DifficultySpec, p: keyof DifficultySpec) {
    return state.spec[p];
  },
}) as DifficultySpec;

/** 라벨→모드 매핑이 필요할 때 사용 */
export const ModeMap = {
  normal: 1 as Mode,
  hard: 2 as Mode,
  hell: 3 as Mode,
};
