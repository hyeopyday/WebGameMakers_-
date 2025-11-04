// FILE: src/component/mob/Runner.tsx
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
import runnerPng from "../../assets/Runner.png";

interface RunnerProps {
  grid: Cell[][];
}

const RUNNER_SPEED = 175;
const CELL_SIZE = TILE_SIZE * SCALE;
const PATH_RECALC_TIME = 0.35;
const SAFE_INNER = 300;
const SAFE_OUTER = 1040;
const ESCAPE_KEEP = 1280;
const GOAL_LOCK_TIME = 0.2;
const PANIC_RECALC_DIST = SAFE_INNER;
const PLAYER_PIXEL_TRIGGER = 24;

const SPRITE_W = 16;
const SPRITE_H = 16;
const SPRITE_SCALE = 2;
const FRAMES = 1;
const ANIM_FPS = 8;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function findPath(
  grid: Cell[][],
  start: { x: number; y: number },
  goal: { x: number; y: number },
  turnPenalty = 0.3
): { x: number; y: number }[] {
  const H = grid.length, W = grid[0].length;
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
  const key = (x: number, y: number) => `${x},${y}`;
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  const open: any[] = [];
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const startK = key(start.x, start.y);
  const goalK = key(goal.x, goal.y);
  gScore.set(startK, 0);
  open.push({ x: start.x, y: start.y, f: 0, g: 0, pdx: 0, pdy: 0 });
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    const ck = key(cur.x, cur.y);
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
    for (const d of dirs) {
      const nx = cur.x + d.dx, ny = cur.y + d.dy;
      if (!inBounds(nx, ny) || grid[ny][nx] === WALL) continue;
      const nk = key(nx, ny);
      const base = (gScore.get(ck) ?? Infinity) + 1;
      const turned = (cur.pdx !== 0 || cur.pdy !== 0) && (cur.pdx !== d.dx || cur.pdy !== d.dy);
      const tg = base + (turned ? turnPenalty : 0);
      if (tg < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, ck);
        gScore.set(nk, tg);
        const h = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
        open.push({ x: nx, y: ny, g: tg, f: tg + h, pdx: d.dx, pdy: d.dy });
      }
    }
  }
  return [];
}

function pickEscapePath(
  grid: Cell[][],
  sxCell: number,
  syCell: number,
  rx: number,
  ry: number,
  px: number,
  py: number,
  preferLeft: boolean
) {
  const H = grid.length, W = grid[0].length;
  const dx = rx - px, dy = ry - py;
  const dist = Math.hypot(dx, dy);
  const denom = Math.max(dist, 1e-6);
  const ux = dx / denom, uy = dy / denom;
  const ox = preferLeft ? -uy : uy;
  const oy = preferLeft ? ux : -ux;
  const steps = [10, 14, 18, 24, 28];
  const cand: { gx: number; gy: number }[] = [];
  for (const k of steps) {
    const ex = rx + ux * (k * CELL_SIZE);
    const ey = ry + uy * (k * CELL_SIZE);
    cand.push({
      gx: clamp(Math.floor(ex / CELL_SIZE), 0, W - 1),
      gy: clamp(Math.floor(ey / CELL_SIZE), 0, H - 1),
    });
  }
  for (const k of steps) {
    const ex = rx + ox * (k * CELL_SIZE);
    const ey = ry + oy * (k * CELL_SIZE);
    cand.push({
      gx: clamp(Math.floor(ex / CELL_SIZE), 0, W - 1),
      gy: clamp(Math.floor(ey / CELL_SIZE), 0, H - 1),
    });
  }
  for (const c of cand) {
    if (grid[c.gy][c.gx] === WALL) continue;
    const p = findPath(grid, { x: sxCell, y: syCell }, { x: c.gx, y: c.gy });
    if (p.length) return p;
  }
  return [];
}

const Runner = ({ grid }: RunnerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !grid?.length || !grid[0]?.length) return;

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
    canvas.style.zIndex = "5";

    const img = new Image();
    img.src = runnerPng;

    const state = {
      px: 0, py: 0, frame: 0, accAnim: 0,
      path: [] as { x: number; y: number }[],
      pathTimer: 0,
      targetX: 0, targetY: 0, havePlayer: false,
      lastTime: 0,
      mode: "idle" as "idle" | "escape",
      lastGoal: { gx: -1, gy: -1 }, goalLock: 0,
      lastPlayerCell: { x: -1, y: -1 },
      lastPlayerPos: { x: 0, y: 0 },
      lastPdist: Number.POSITIVE_INFINITY,
      preferLeft: true,
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

    function panicRecalc() {
      const sx = Math.floor(state.px / CELL_SIZE);
      const sy = Math.floor(state.py / CELL_SIZE);
      let newPath = pickEscapePath(grid, sx, sy, state.px, state.py, state.targetX, state.targetY, state.preferLeft);
      const pdx = state.targetX - state.px;
      const pdy = state.targetY - state.py;
      const pdist = Math.hypot(pdx, pdy);
      if ((!newPath.length || pdist < ESCAPE_KEEP) && pdist > 1e-6) {
        const ux = (state.px - state.targetX) / pdist;
        const uy = (state.py - state.targetY) / pdist;
        const farCells = 32;
        const gx = clamp(Math.floor((state.px + ux * farCells * CELL_SIZE) / CELL_SIZE), 0, grid[0].length - 1);
        const gy = clamp(Math.floor((state.py + uy * farCells * CELL_SIZE) / CELL_SIZE), 0, grid.length - 1);
        const farPath = findPath(grid, { x: sx, y: sy }, { x: gx, y: gy });
        if (farPath.length) newPath = farPath;
      }
      if (newPath.length) {
        state.path = newPath;
        const g = newPath[newPath.length - 1];
        state.lastGoal = { gx: g.x, gy: g.y };
        state.goalLock = GOAL_LOCK_TIME;
        state.preferLeft = !state.preferLeft;
      }
      state.pathTimer = 0;
    }

    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      const dt = Math.min(0.033, (t - state.lastTime) / 1000);
      state.lastTime = t;
      state.pathTimer += dt;
      if (state.goalLock > 0) state.goalLock -= dt;

      const pdx = state.targetX - state.px;
      const pdy = state.targetY - state.py;
      const pdist = Math.hypot(pdx, pdy);

      if (state.mode === "idle" && pdist < SAFE_INNER) state.mode = "escape";
      else if (state.mode === "escape" && pdist > SAFE_OUTER) state.mode = "idle";

      const pcx = Math.floor(state.targetX / CELL_SIZE);
      const pcy = Math.floor(state.targetY / CELL_SIZE);
      const playerMovedCell = pcx !== state.lastPlayerCell.x || pcy !== state.lastPlayerCell.y;
      const playerDx = state.targetX - state.lastPlayerPos.x;
      const playerDy = state.targetY - state.lastPlayerPos.y;
      const playerMovedPx = Math.hypot(playerDx, playerDy);
      const closingFast = pdist < state.lastPdist - 12;

      if (state.havePlayer && state.mode === "escape" && pdist <= PANIC_RECALC_DIST) {
        state.goalLock = 0;
        panicRecalc();
      } else {
        if (state.havePlayer && state.mode === "escape" &&
          (state.pathTimer >= PATH_RECALC_TIME || playerMovedCell ||
            playerMovedPx > PLAYER_PIXEL_TRIGGER || closingFast ||
            (state.path.length === 0 && pdist < ESCAPE_KEEP) ||
            (state.goalLock <= 0 && pdist <= SAFE_INNER * 1.1))) {
          if (pdist <= SAFE_INNER * 1.1) state.goalLock = 0;
          if (state.goalLock <= 0 || pdist <= SAFE_INNER * 1.1) panicRecalc();
          else if (state.pathTimer >= PATH_RECALC_TIME) panicRecalc();
        }
      }

      if (state.path.length > 0) {
        const idx = Math.min(1, state.path.length - 1);
        const next = state.path[idx];
        const tx = next.x * CELL_SIZE + CELL_SIZE / 2;
        const ty = next.y * CELL_SIZE + CELL_SIZE / 2;
        const ndx = tx - state.px;
        const ndy = ty - state.py;
        const d2 = Math.hypot(ndx, ndy);
        if (d2 < 8) {
          state.path.shift();
        } else {
          const denom = Math.max(d2, 1e-6);
          const vx = (ndx / denom) * RUNNER_SPEED;
          const vy = (ndy / denom) * RUNNER_SPEED;
          const moved = moveWithWorldCollision(state.px, state.py, vx, vy, dt, grid);
          state.px = clamp(moved.x, 0, WORLD_W);
          state.py = clamp(moved.y, 0, WORLD_H);
          window.dispatchEvent(new CustomEvent("runner-pos", { detail: { x: state.px, y: state.py } }));
        }
      } else if (state.mode === "escape" && pdist < ESCAPE_KEEP) {
        state.pathTimer = PATH_RECALC_TIME;
      }

      state.accAnim += dt;
      if (state.accAnim >= 1 / ANIM_FPS) {
        state.frame = (state.frame + 1) % FRAMES;
        state.accAnim = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      if (img.complete && img.naturalWidth > 0) {
        const destW = SPRITE_W * SPRITE_SCALE;
        const destH = SPRITE_H * SPRITE_SCALE;
        ctx.drawImage(
          img,
          0, 0, SPRITE_W, SPRITE_H,
          Math.floor(state.px - destW / 2),
          Math.floor(state.py - destH),
          destW, destH
        );
      }

      state.lastPlayerCell = { x: pcx, y: pcy };
      state.lastPlayerPos = { x: state.targetX, y: state.targetY };
      state.lastPdist = pdist;

      raf = requestAnimationFrame(loop);
    };

    // 최초 위치도 즉시 한 번 알림
    window.dispatchEvent(new CustomEvent("runner-pos", { detail: { x: state.px, y: state.py } }));

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
export default Runner;
