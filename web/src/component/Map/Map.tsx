import React, { useEffect, useRef } from "react";
import tileset from "../../assets/Dungeon_Tileset.png";
import Character from "../../component/mob/Character";
import "./Map.css";

/** ====== 기본 설정 ====== */
const TILE_SIZE = 16;
const SCALE = 2;
const MAP_WIDTH = 51;   // 홀수 권장
const MAP_HEIGHT = 25;  // 홀수 권장

// 디버그(단색) 켬/끔
const USE_DEBUG = false;

type Cell = 0 | 1; // 0=길, 1=벽
const FLOOR: Cell = 0;
const WALL:  Cell = 1;

/** ====== 유틸 ====== */
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T,>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function createGrid(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => WALL));
}
const inBounds = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;

/** ====== 미로 생성 (DFS + 후처리로 개방감) ====== */
const DIRS = [
  [0, -2], [2, 0], [0, 2], [-2, 0],
] as const;

function carveMazeDFS(grid: Cell[][], sx = 1, sy = 1) {
  if (sx % 2 === 0) sx += 1;
  if (sy % 2 === 0) sy += 1;

  grid[sy][sx] = FLOOR;
  const stack: [number, number][] = [[sx, sy]];

  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const dirs = shuffle([...DIRS]);
    let carved = false;

    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (!inBounds(nx, ny)) continue;
      if (grid[ny][nx] === WALL) {
        const mx = cx + dx / 2, my = cy + dy / 2;
        grid[my][mx] = FLOOR;
        grid[ny][nx] = FLOOR;
        stack.push([nx, ny]);
        carved = true;
        break;
      }
    }
    if (!carved) stack.pop();
  }
}

function addSmallRooms(
  grid: Cell[][],
  { count = 3, minW = 3, maxW = 7, minH = 3, maxH = 5 } = {}
) {
  let tries = 0, placed = 0;
  while (placed < count && tries < count * 12) {
    tries++;
    const rw = (Math.max(3, randInt(minW, maxW)) | 1);
    const rh = (Math.max(3, randInt(minH, maxH)) | 1);
    const rx = (randInt(1, MAP_WIDTH - rw - 2) | 1);
    const ry = (randInt(1, MAP_HEIGHT - rh - 2) | 1);
    if (!inBounds(rx + rw - 1, ry + rh - 1)) continue;

    let ok = true;
    for (let y = ry - 1; y < ry + rh + 1 && ok; y++) {
      for (let x = rx - 1; x < rx + rw + 1; x++) {
        if (!inBounds(x, y) || grid[y][x] === FLOOR) { ok = false; break; }
      }
    }
    if (!ok) continue;

    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++)
        grid[y][x] = FLOOR;

    const doors = randInt(1, 2);
    for (let i = 0; i < doors; i++) {
      const side = randInt(0, 3);
      if (side === 0) { const dx = (randInt(rx, rx + rw - 1) | 1); if (inBounds(dx, ry - 1)) grid[ry - 1][dx] = FLOOR; }
      if (side === 1) { const dy = (randInt(ry, ry + rh - 1) | 1); if (inBounds(rx + rw, dy)) grid[dy][rx + rw] = FLOOR; }
      if (side === 2) { const dx = (randInt(rx, rx + rw - 1) | 1); if (inBounds(dx, ry + rh)) grid[ry + rh][dx] = FLOOR; }
      if (side === 3) { const dy = (randInt(ry, ry + rh - 1) | 1); if (inBounds(rx - 1, dy)) grid[dy][rx - 1] = FLOOR; }
    }
    placed++;
  }
}

function carveHighways(grid: Cell[][], { horiz = 1, vert = 1, thickness = 1 } = {}) {
  for (let i = 0; i < horiz; i++) {
    let y = (randInt(3, MAP_HEIGHT - 4) | 1);
    for (let t = 0; t < thickness; t++) {
      const yy = y + t; if (!inBounds(1, yy)) continue;
      for (let x = 1; x < MAP_WIDTH - 1; x++) grid[yy][x] = FLOOR;
    }
  }
  for (let i = 0; i < vert; i++) {
    let x = (randInt(3, MAP_WIDTH - 4) | 1);
    for (let t = 0; t < thickness; t++) {
      const xx = x + t; if (!inBounds(xx, 1)) continue;
      for (let y = 1; y < MAP_HEIGHT - 1; y++) grid[y][xx] = FLOOR;
    }
  }
}

function braidDeadEnds(grid: Cell[][], ratio = 0.28) {
  const deadEnds: [number, number][] = [];
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (grid[y][x] !== FLOOR) continue;
      let p = 0;
      if (grid[y-1][x] === FLOOR) p++;
      if (grid[y+1][x] === FLOOR) p++;
      if (grid[y][x-1] === FLOOR) p++;
      if (grid[y][x+1] === FLOOR) p++;
      if (p === 1) deadEnds.push([x, y]);
    }
  }
  const target = Math.floor(deadEnds.length * ratio);
  shuffle(deadEnds).slice(0, target).forEach(([x, y]) => {
    const c: [number, number][] = [];
    if (grid[y-1]?.[x] === WALL && inBounds(x, y-2) && grid[y-2][x] === FLOOR) c.push([x, y-1]);
    if (grid[y+1]?.[x] === WALL && inBounds(x, y+2) && grid[y+2][x] === FLOOR) c.push([x, y+1]);
    if (grid[y]?.[x-1] === WALL && inBounds(x-2, y) && grid[y][x-2] === FLOOR) c.push([x-1, y]);
    if (grid[y]?.[x+1] === WALL && inBounds(x+2, y) && grid[y][x+2] === FLOOR) c.push([x+1, y]);
    if (!c.length) return;
    const [wx, wy] = c[randInt(0, c.length - 1)];
    grid[wy][wx] = FLOOR;
  });
}

function openWallsForOpenness(grid: Cell[][], probability = 0.35) {
  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (grid[y][x] !== WALL) continue;
      const lr = grid[y][x-1] === FLOOR && grid[y][x+1] === FLOOR;
      const ud = grid[y-1][x] === FLOOR && grid[y+1][x] === FLOOR;
      const around =
        (grid[y-1][x] === FLOOR ? 1 : 0) +
        (grid[y+1][x] === FLOOR ? 1 : 0) +
        (grid[y][x-1] === FLOOR ? 1 : 0) +
        (grid[y][x+1] === FLOOR ? 1 : 0);
      if (lr || ud || around >= 3) {
        if (Math.random() < probability) grid[y][x] = FLOOR;
      }
    }
  }
}

/** ====== 오토타일 (왼쪽 위 3×3 세트만 사용) ====== */
// 필요한 경우 여기만 조정 (왼쪽 위가 아니라 옆칸이면 1로, 두 칸 옆이면 2로)

const WALL_TILE: [number, number] = [2, 0];
const FLOOR_TILE: [number, number] = [1, 1];
const TORCH_TILE: [number, number] = [15, 0];

function drawDebug(grid: Cell[][], ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      ctx.fillStyle = grid[y][x] === FLOOR ? "#2b2133" : "#503840";
      ctx.fillRect(
        x * TILE_SIZE * SCALE,
        y * TILE_SIZE * SCALE,
        TILE_SIZE * SCALE,
        TILE_SIZE * SCALE
      );
    }
  }
}

function drawTiles(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const [tx, ty] = (grid[y][x] === FLOOR) ? FLOOR_TILE : WALL_TILE;

      ctx.drawImage(
        img,
        tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE, TILE_SIZE * SCALE, TILE_SIZE * SCALE
      );
    }
  }
}

/** ====== 컴포넌트 ====== */
const Map: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1) 데이터 생성 (개방감 있게)
    const grid = createGrid(MAP_WIDTH, MAP_HEIGHT);
    carveMazeDFS(grid, 1, 1);
    addSmallRooms(grid, { count: 3 });
    carveHighways(grid, { horiz: 1, vert: 1, thickness: 1 });
    braidDeadEnds(grid, 0.28);
    openWallsForOpenness(grid, 0.35);

    // 2) 렌더
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (USE_DEBUG) {
      drawDebug(grid, ctx);
    } else {
      const img = new Image();
      img.src = tileset;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTiles(grid, ctx, img);
      };
    }
  }, []);

  return (
    <div id="Map" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        className="map-canvas"
        width={MAP_WIDTH * TILE_SIZE * SCALE}
        height={MAP_HEIGHT * TILE_SIZE * SCALE}
      />
      <Character /> {/* 캐릭터 추가 */}
    </div>
  );
};

export default Map;