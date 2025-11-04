// FILE: src/components/Physic/Physic.ts
import type { Cell } from "../../../type/type";
import { TILE_SIZE, SCALE, FLOOR, FOOT_OFFSET, getColliderRadius } from "../../../type/type";

/** 월드<->타일 좌표 변환 */
export const worldToTile = (x: number, y: number, tileSize: number, scale: number) => {
  const s = tileSize * scale;
  return { tx: Math.floor(x / s), ty: Math.floor(y / s) };
};
export const tileToWorld = (tx: number, ty: number, tileSize: number, scale: number) => {
  const s = tileSize * scale;
  return { x: tx * s, y: ty * s };
};

/** 내부: 그리드 경계 */
const inBounds = (grid: Cell[][], tx: number, ty: number) =>
  ty >= 0 && ty < grid.length && tx >= 0 && tx < grid[0].length;

export interface MoveOpts {
  tileSize: number;
  scale: number;
  radius: number;        // 콜라이더 반지름(월드 px)
  footOffset?: number;   // py가 '발' 좌표면 0
  isSolid?: (cell: Cell) => boolean; // true면 벽
}

/** circle(A) vs tile AABB 충돌 최소보정 */
function resolveCircleVsTile(
  cx: number, cy: number, r: number,
  tx: number, ty: number,
  tileSize: number, scale: number
) {
  const s = tileSize * scale;
  const { x: wx, y: wy } = tileToWorld(tx, ty, tileSize, scale);
  const ax = wx, ay = wy, bx = wx + s, by = wy + s;

  const nx = Math.max(ax, Math.min(cx, bx));
  const ny = Math.max(ay, Math.min(cy, by));
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { pushX: 0, pushY: 0, hit: false };

  const d = Math.max(1e-6, Math.sqrt(d2));
  const pen = r - d;
  return { pushX: (dx / d) * pen, pushY: (dy / d) * pen, hit: true };
}

/** 이동+슬라이드 충돌 처리 (X→Y 분리) */
export function sweepMove(
  px: number, py: number,
  vx: number, vy: number,
  dt: number,
  grid: Cell[][],
  opts: MoveOpts
) {
  const { tileSize, scale, radius, footOffset = 0, isSolid } = opts;
  const s = tileSize * scale;

  const isWallTile = (tx: number, ty: number) =>
    inBounds(grid, tx, ty) && (isSolid ? isSolid(grid[ty][tx]) : false);

  const gatherSolidTiles = (cx: number, cy: number, r: number) => {
    const minTx = Math.floor((cx - r) / s);
    const maxTx = Math.floor((cx + r) / s);
    const minTy = Math.floor((cy - r) / s);
    const maxTy = Math.floor((cy + r) / s);
    const tiles: Array<{ tx: number; ty: number }> = [];
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (isWallTile(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  };

  // 1) X
  let nx = px + vx * dt;
  let ny = py;
  let cx = nx, cy = ny - footOffset;

  {
    const solids = gatherSolidTiles(cx, cy, radius);
    let totalPushX = 0;
    for (const t of solids) {
      const res = resolveCircleVsTile(cx, cy, radius, t.tx, t.ty, tileSize, scale);
      if (res.hit) totalPushX += res.pushX;
    }
    if (totalPushX) {
      nx += totalPushX;
      cx += totalPushX;
    }
  }

  // 2) Y
  ny = py + vy * dt;
  cx = nx; cy = ny - footOffset;

  {
    const solids = gatherSolidTiles(cx, cy, radius);
    let totalPushY = 0;
    for (const t of solids) {
      const res = resolveCircleVsTile(cx, cy, radius, t.tx, t.ty, tileSize, scale);
      if (res.hit) totalPushY += res.pushY;
    }
    if (totalPushY) {
      ny += totalPushY;
      cy += totalPushY;
    }
  }

  // 경계 클램프
  const maxX = grid[0].length * s;
  const maxY = grid.length * s;
  nx = Math.max(radius, Math.min(maxX - radius, nx));
  ny = Math.max(radius, Math.min(maxY, ny));

  return { x: nx, y: ny };
}

/** ✅ 캐릭터/몹 공용 충돌 래퍼 */
export function moveWithWorldCollision(
  px: number, py: number,
  vx: number, vy: number,
  dt: number,
  grid: Cell[][]
) {
  return sweepMove(px, py, vx, vy, dt, grid, {
    tileSize: TILE_SIZE,
    scale: SCALE,
    radius: getColliderRadius(), // = TILE_SIZE * SCALE * COLLIDER_RATIO
    footOffset: FOOT_OFFSET,
    isSolid: (cell) => cell !== FLOOR, // 보라색=길 → 길이 아니면 벽
  });
}
