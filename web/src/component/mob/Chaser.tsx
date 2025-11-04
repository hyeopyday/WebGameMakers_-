// FILE: src/component/mob/Chaser.tsx
import { useEffect, useRef } from "react";
import type { Cell } from "../../type/type";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  SCALE,
  TILE_SIZE,
  findSpawnPoint,
  WALL,
} from "../../type/type";
import { moveWithWorldCollision } from "./Physic/Physic";
import enemyPng from "../../assets/Chaser.png";

interface ChaserProps {
  grid: Cell[][];
}

const CHASER_SPEED = 170;
const PATH_RECALC_TIME = 0.3;
const ATTACK_RANGE = 25;
const ATTACK_FREEZE = 0.4;
const SPRITE_W = 32;
const SPRITE_H = 32;
const SPRITE_SCALE = 2;
const FRAMES = 4;
const ANIM_FPS = 8;
const CELL_SIZE = TILE_SIZE * SCALE;

// ▼ 추가: 공격 쿨다운
const ATTACK_COOLDOWN = 0.9;

function findPath(
  grid: Cell[][],
  start: { x: number; y: number },
  goal: { x: number; y: number }
): { x: number; y: number }[] {
  const H = grid.length;
  const W = grid[0].length;
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const key = (x: number, y: number) => `${x},${y}`;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const open: { x: number; y: number; f: number; g: number }[] = [];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();

  const startK = key(start.x, start.y);
  const goalK = key(goal.x, goal.y);
  gScore.set(startK, 0);
  open.push({ ...start, f: 0, g: 0 });

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const ck = key(current.x, current.y);
    if (ck === goalK) {
      const path: { x: number; y: number }[] = [];
      let c = ck;
      while (cameFrom.has(c)) {
        const [cx, cy] = c.split(",").map(Number);
        path.push({ x: cx, y: cy });
        c = cameFrom.get(c)!;
      }
      return path.reverse();
    }

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!inBounds(nx, ny) || grid[ny][nx] === WALL) continue;
      const nk = key(nx, ny);
      const tentativeG = (gScore.get(ck) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, ck);
        gScore.set(nk, tentativeG);
        const h = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
        const f = tentativeG + h;
        open.push({ x: nx, y: ny, f, g: tentativeG });
      }
    }
  }
  return [];
}

const Chaser = ({ grid }: ChaserProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!grid?.length || !grid[0]?.length) return;

    const WORLD_W = MAP_WIDTH * TILE_SIZE * SCALE;
    const WORLD_H = MAP_HEIGHT * TILE_SIZE * SCALE;
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.pointerEvents = "none";
    // @ts-ignore
    canvas.style.imageRendering = "pixelated";
    canvas.style.backgroundColor = "transparent";

    const enemyImg = new Image();
    enemyImg.src = enemyPng;

    const state = {
      px: 0,
      py: 0,
      dir: 0,
      frame: 0,
      accAnim: 0,
      mode: "idle" as "idle" | "attack",
      attackFreeze: 0,
      // ▼ 추가: 공격 쿨다운
      attackCD: 0,

      path: [] as { x: number; y: number }[],
      pathTimer: 0,
      targetX: 0,
      targetY: 0,
      havePlayer: false,
      lastTime: 0,
    };

    const s = findSpawnPoint(grid, { clearance: 0 });
    state.px = s.x;
    state.py = s.y;

    const onPlayerPos = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      state.targetX = ce.detail.x;
      state.targetY = ce.detail.y;
      state.havePlayer = true;
    };
    window.addEventListener("player-pos", onPlayerPos as EventListener);

    let raf = 0;

    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      const dt = Math.min(0.033, (t - state.lastTime) / 1000);
      state.lastTime = t;
      state.pathTimer += dt;

      // ▼ 쿨다운 감소
      if (state.attackCD > 0) state.attackCD = Math.max(0, state.attackCD - dt);

      const dx = state.targetX - state.px;
      const dy = state.targetY - state.py;
      const dist = Math.hypot(dx, dy);

      // 상태 전환
      if (dist < ATTACK_RANGE && state.mode !== "attack") {
        state.mode = "attack";
        state.attackFreeze = ATTACK_FREEZE;
      } else if (state.mode === "attack" && state.attackFreeze <= 0 && dist >= ATTACK_RANGE) {
        state.mode = "idle";
      }

      if (state.attackFreeze > 0) state.attackFreeze -= dt;

      // ▼ 공격 판정: 사정거리 + 쿨다운 여유
      if (dist < ATTACK_RANGE && state.attackCD <= 0) {
        window.dispatchEvent(new CustomEvent("player-hit", { detail: { dmg: 1 } }));
        state.attackCD = ATTACK_COOLDOWN;
      }

      // 방향 계산
      if (Math.abs(dx) > Math.abs(dy)) {
        state.dir = dx > 0 ? 2 : 1;
      } else {
        state.dir = dy > 0 ? 0 : 3;
      }

      // 경로 갱신
      if (state.havePlayer && state.pathTimer >= PATH_RECALC_TIME) {
        const sx = Math.floor(state.px / CELL_SIZE);
        const sy = Math.floor(state.py / CELL_SIZE);
        const gx = Math.floor(state.targetX / CELL_SIZE);
        const gy = Math.floor(state.targetY / CELL_SIZE);
        const newPath = findPath(grid, { x: sx, y: sy }, { x: gx, y: gy });
        if (newPath.length > 0) state.path = newPath;
        state.pathTimer = 0;
      }

      // 이동 (공격 중엔 잠시 멈춤)
      if (state.attackFreeze <= 0 && state.path.length > 0) {
        const next = state.path[0];
        const tx = next.x * CELL_SIZE + CELL_SIZE / 2;
        const ty = next.y * CELL_SIZE + CELL_SIZE / 2;
        const ndx = tx - state.px;
        const ndy = ty - state.py;
        const distToNext = Math.hypot(ndx, ndy);
        if (distToNext < 4) state.path.shift();
        else {
          const vx = (ndx / distToNext) * CHASER_SPEED;
          const vy = (ndy / distToNext) * CHASER_SPEED;
          const moved = moveWithWorldCollision(state.px, state.py, vx, vy, dt, grid);
          state.px = moved.x;
          state.py = moved.y;
        }
      }

      // 애니메이션
      state.accAnim += dt;
      if (state.accAnim >= 1 / ANIM_FPS) {
        state.frame = (state.frame + 1) % FRAMES;
        state.accAnim = 0;
      }

      // 렌더링
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const dirOffset = state.dir * SPRITE_H;
      const animRow =
        state.mode === "attack"
          ? 4 * SPRITE_H + dirOffset
          : 0 * SPRITE_H + dirOffset;

      const sx = state.frame * SPRITE_W;
      const sy = animRow;

      const destW = SPRITE_W * SPRITE_SCALE;
      const destH = SPRITE_H * SPRITE_SCALE;

      ctx.drawImage(
        enemyImg,
        sx, sy, SPRITE_W, SPRITE_H,
        state.px - destW / 2,
        state.py - destH,
        destW, destH
      );

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("player-pos", onPlayerPos as EventListener);
    };
  }, [grid]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE * SCALE}
      height={MAP_HEIGHT * TILE_SIZE * SCALE}
    />
  );
};

export default Chaser;
