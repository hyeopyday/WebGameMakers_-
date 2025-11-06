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
  paused?: boolean;
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
const ATTACK_COOLDOWN = 0.9;

// ✅ 위치 유지를 위한 전역 상태
let globalChaserState: {
  px: number;
  py: number;
  initialized: boolean;
} | null = null;

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

const Chaser = ({ grid, paused }: ChaserProps) => {
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
    canvas.style.zIndex = "30";

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
      attackCD: 0,
      path: [] as { x: number; y: number }[],
      pathTimer: 0,
      targetX: 0,
      targetY: 0,
      havePlayer: false,
      lastTime: 0,
      slowMult: 1,
      slowUntil: 0,
      rootUntil: 0,
      fearUntil: 0,
    };

    // ✅ 최초 한 번만 스폰
    if (!globalChaserState || !globalChaserState.initialized) {
      const s = findSpawnPoint(grid, { clearance: 0 });
      state.px = s.x;
      state.py = s.y;
      globalChaserState = { px: s.x, py: s.y, initialized: true };
    } else {
      state.px = globalChaserState.px;
      state.py = globalChaserState.py;
    }

    const onPlayerPos = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      state.targetX = ce.detail.x;
      state.targetY = ce.detail.y;
      state.havePlayer = true;
    };

    const onSlow = () => {
      state.slowMult = 0.4; // 60% 감속
      state.slowUntil = performance.now() + 3000; // 3초
    };
    const onRoot = () => { state.rootUntil = performance.now() + 1500; }; // 1.5초 묶임
    const onFear = () => { state.fearUntil = performance.now() + 800; };   // 0.8초 공포(도주/멈춤)

    window.addEventListener("player-pos", onPlayerPos as EventListener);
    window.addEventListener("item-slow", onSlow);
    window.addEventListener("item-root", onRoot);
    window.addEventListener("item-fear", onFear);

    // ✅ 몹 재배치 이벤트 리스너 - 무작위 위치
    const onRepositionMobs = () => {
      // 새로운 무작위 스폰 위치 찾기
      const newSpawn = findSpawnPoint(grid, { clearance: 0 });
      state.px = newSpawn.x;
      state.py = newSpawn.y;

      // 전역 상태 업데이트
      if (globalChaserState) {
        globalChaserState.px = state.px;
        globalChaserState.py = state.py;
      }

      // 경로 초기화
      state.path = [];
      state.mode = "idle";
      state.attackCD = 0;
      state.attackFreeze = 0;

      console.log(`Chaser repositioned to random location: (${Math.floor(state.px)}, ${Math.floor(state.py)})`);
    };
    window.addEventListener("reposition-mobs", onRepositionMobs as EventListener);

    let raf = 0;

    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      const dt = Math.min(0.033, (t - state.lastTime) / 1000);
      state.lastTime = t;

      if (paused) {
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
        return;
      }

      state.pathTimer += dt;
      if (state.attackCD > 0) state.attackCD = Math.max(0, state.attackCD - dt);

      const dx = state.targetX - state.px;
      const dy = state.targetY - state.py;
      const dist = Math.hypot(dx, dy);

      if (dist < ATTACK_RANGE && state.mode !== "attack") {
        state.mode = "attack";
        state.attackFreeze = ATTACK_FREEZE;
      } else if (state.mode === "attack" && state.attackFreeze <= 0 && dist >= ATTACK_RANGE) {
        state.mode = "idle";
      }

      if (state.attackFreeze > 0) state.attackFreeze -= dt;

      if (dist < ATTACK_RANGE && state.attackCD <= 0) {
        window.dispatchEvent(new CustomEvent("player-hit", { detail: { dmg: 1 } }));
        state.attackCD = ATTACK_COOLDOWN;
      }

      if (Math.abs(dx) > Math.abs(dy)) {
        state.dir = dx > 0 ? 2 : 1;
      } else {
        state.dir = dy > 0 ? 0 : 3;
      }

      if (state.havePlayer && state.pathTimer >= PATH_RECALC_TIME) {
        const sx = Math.floor(state.px / CELL_SIZE);
        const sy = Math.floor(state.py / CELL_SIZE);
        const gx = Math.floor(state.targetX / CELL_SIZE);
        const gy = Math.floor(state.targetY / CELL_SIZE);
        const newPath = findPath(grid, { x: sx, y: sy }, { x: gx, y: gy });
        if (newPath.length > 0) state.path = newPath;
        state.pathTimer = 0;
      }

      const now = performance.now();
      if (now > state.slowUntil) state.slowMult = 1;
      
      // 경로/이동 전에 루트/공포 처리
      const rooted = now < state.rootUntil;
      const feared = now < state.fearUntil;
      
      if (!rooted) {
        if (feared) {
          // 😱 공포 상태: 플레이어 반대 방향으로 잠깐 이동
          const dx = state.px - state.targetX;
          const dy = state.py - state.targetY;
          const d = Math.hypot(dx, dy) || 1;
          const speed = CHASER_SPEED * state.slowMult;
          const vx = (dx / d) * speed;
          const vy = (dy / d) * speed;
          const moved = moveWithWorldCollision(state.px, state.py, vx, vy, dt, grid);
          state.px = moved.x;
          state.py = moved.y;
      
          if (globalChaserState) {
            globalChaserState.px = state.px;
            globalChaserState.py = state.py;
          }
        } else if (state.attackFreeze <= 0 && state.path.length > 0) {
          // 🧠 평상시: 기존 path 기반 이동 + 슬로우 반영
          const next = state.path[0];
          const tx = next.x * CELL_SIZE + CELL_SIZE / 2;
          const ty = next.y * CELL_SIZE + CELL_SIZE / 2;
          const ndx = tx - state.px;
          const ndy = ty - state.py;
          const distToNext = Math.hypot(ndx, ndy);
      
          if (distToNext < 4) state.path.shift();
          else {
            const speed = CHASER_SPEED * state.slowMult; // ✅ 슬로우 반영
            const vx = (ndx / distToNext) * speed;
            const vy = (ndy / distToNext) * speed;
            const moved = moveWithWorldCollision(state.px, state.py, vx, vy, dt, grid);
            state.px = moved.x;
            state.py = moved.y;
      
            if (globalChaserState) {
              globalChaserState.px = state.px;
              globalChaserState.py = state.py;
            }
          }
        }
      }

      state.accAnim += dt;
      if (state.accAnim >= 1 / ANIM_FPS) {
        state.frame = (state.frame + 1) % FRAMES;
        state.accAnim = 0;
      }

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
      window.removeEventListener("reposition-mobs", onRepositionMobs as EventListener);
      window.removeEventListener("item-slow", onSlow);
      window.removeEventListener("item-root", onRoot);
      window.removeEventListener("item-fear", onFear);
    };
  }, [grid, paused]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE * SCALE}
      height={MAP_HEIGHT * TILE_SIZE * SCALE}
    />
  );
};

export default Chaser;