
export type Cell = 0 | 1;

export const FLOOR: Cell = 0;
export const WALL: Cell = 1;

export const MAP_WIDTH = 51;
export const MAP_HEIGHT = 25;

export const TILE_SIZE = 16;
export const SCALE = 2;


/** ====== 공통 월드 상수 ====== */

/** 캐릭터·몹의 이동 속도(px/s 단위) */
export const MOVE_SPEED = 200;

/** 애니메이션 FPS (초당 프레임 전환 속도) */
export const ANIM_FPS = 10;

/** 스프라이트 확대 배율 */
export const SPRITE_SCALE = 2;

/** 콜라이더 반지름 비율
 *  - TILE_SIZE * SCALE * COLLIDER_RATIO 로 실제 픽셀 크기 계산
 *  - 좁은 길에서 끼면 ↓ 줄이고, 벽에 파고들면 ↑ 키우기
 */
export const COLLIDER_RATIO = 0.2;

/** 캐릭터/몹 콜라이더 실제 반지름 계산 헬퍼 */
export const COLLIDER_RADIUS = TILE_SIZE * SCALE * COLLIDER_RATIO;

/** 발 위치 오프셋(px)
 *  - py 좌표가 '발'이라면 0
 *  - 스프라이트의 발이 그림 아래쪽에서 위로 5~10px쯤이면 양수로 조절
 */
export const FOOT_OFFSET = 0;


// 벽/바닥 판정 공용 함수 (보라색=길)
export function isSolid(cell: Cell): boolean {
  return cell !== FLOOR; // 길(FLOOR)이 아니면 전부 벽/장애물
}

export function randInt(min: number, max: number) {
  return (min + Math.floor(Math.random() * (max - min + 1)));
}

/**
 * 랜덤 스폰 포인트를 찾는다.
 * - clearance: 스폰 타일 주변 (체비쇼프 거리) 몇 타일이 모두 길이어야 하는지
 *   (1이면 주변 8칸까지 전부 길이어야 함)
 * - tries: 시도 횟수
 * - 반환 좌표는 "월드 좌표(px)"이며, py는 '발 라인'에 맞춘다.
 */

export function getColliderRadius(
  tileSize: number = TILE_SIZE,
  scale: number = SCALE,
  ratio: number = COLLIDER_RATIO
) {
  return tileSize * scale * ratio;
}

export function findSpawnPoint(
  grid: Cell[][],
  opts?: { clearance?: number; tries?: number; tileSize?: number; scale?: number }
): { x: number; y: number } {
  const tileSize = opts?.tileSize ?? TILE_SIZE;
  const scale    = opts?.scale ?? SCALE;
  const s = tileSize * scale;

  const H = grid?.length ?? 0;
  const W = H ? grid[0]?.length ?? 0 : 0;

  // ✅ 그리드가 비어 있으면 안전한 기본값 반환
  if (H === 0 || W === 0) {
    return { x: 0.5 * s, y: 1 * s };
  }

  const clearance = opts?.clearance ?? 0;
  const tries     = opts?.tries ?? 400;

  const isClear = (tx: number, ty: number) => {
    for (let dy = -clearance; dy <= clearance; dy++) {
      for (let dx = -clearance; dx <= clearance; dx++) {
        const nx = tx + dx, ny = ty + dy;
        if (ny < 0 || ny >= H || nx < 0 || nx >= W) return false;
        if (isSolid(grid[ny][nx])) return false;
      }
    }
    return true;
  };

  for (let i = 0; i < tries; i++) {
    const tx = Math.floor(Math.random() * W);
    const ty = Math.floor(Math.random() * H);
    if (isClear(tx, ty)) {
      return { x: (tx + 0.5) * s, y: (ty + 1) * s };
    }
  }

  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      if (isClear(tx, ty)) return { x: (tx + 0.5) * s, y: (ty + 1) * s };
    }
  }
  return { x: 0.5 * s, y: 1 * s };
}
