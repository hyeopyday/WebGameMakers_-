import { useEffect, useRef } from "react";
import type { Cell } from "../../type/type";
import { FLOOR, WALL } from "../../type/type";
import tileset from "../../assets/Dungeon_Tileset.png";
import Character from "../../component/mob/Character";
import "./Map.css";

/** ====== 기본 설정 ====== */
const TILE_SIZE = 16;
const SCALE = 2;
const MAP_WIDTH = 51;   // 홀수 권장
const MAP_HEIGHT = 25;  // 홀수 권장

/** ====== 오토타일 (왼쪽 위 3×3 세트만 사용) ====== */
// 필요한 경우 여기만 조정 (왼쪽 위가 아니라 옆칸이면 1로, 두 칸 옆이면 2로)

const WALL_TILE: [number, number] = [2, 0];
const FLOOR_TILE: [number, number] = [2, 2];
const TORCH_TILE: [number, number] = [0, 9];
const SKELETON_TILE: [number, number] = [7, 7];

function drawTorches(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const H = grid.length, W = grid[0].length;
  const probability = 0.05;

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (grid[y][x] !== WALL) continue;
      let ny = y;
      while (ny + 1 < H && grid[ny + 1][x] === WALL) ny++;
      if (ny + 1 < H && grid[ny + 1][x] === FLOOR) {
        if (Math.random() < probability) {
          const [tx, ty] = TORCH_TILE;
          ctx.drawImage(
            img, tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
            x * TILE_SIZE * SCALE, ny * TILE_SIZE * SCALE,
            TILE_SIZE * SCALE, TILE_SIZE * SCALE
          );
        }
      }
    }
  }
}

function drawSkeletons(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const H = grid.length, W = grid[0].length;
  const probability = 0.01;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== FLOOR) continue;
      if (Math.random() >= probability) continue;
      const [tx, ty] = SKELETON_TILE;
      ctx.drawImage(
        img, tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE,
        TILE_SIZE * SCALE, TILE_SIZE * SCALE
      );
    }
  }
}

/** ====== 기존 drawTiles() 수정 ====== */
function drawTiles(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  if (!grid?.length || !grid[0]?.length) return; // ✅ 그리드 준비 전엔 그리지 않음
  ctx.imageSmoothingEnabled = false;

  const H = grid.length;
  const W = grid[0].length;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [tx, ty] = (grid[y][x] === FLOOR) ? FLOOR_TILE : WALL_TILE;
      ctx.drawImage(
        img,
        tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE,
        TILE_SIZE * SCALE, TILE_SIZE * SCALE
      );
    }
  }

  drawTorches(grid, ctx, img);    // (이 함수들도 내부에서 H/W 계산하도록 수정 권장)
  drawSkeletons(grid, ctx, img);  // 아래 1-1 참고
}



interface MapProps {
    grid : Cell[][];
}

/** ====== 컴포넌트 ====== */
const Map = ({grid}: MapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.src = tileset;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawTiles(grid, ctx, img);
    };

  }, [grid]);

  return (
    <div id="Map" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        className="map-canvas"
        width={MAP_WIDTH * TILE_SIZE * SCALE}
        height={MAP_HEIGHT * TILE_SIZE * SCALE}
      />
      <Character grid = {grid}/> {/* 캐릭터 추가 */}
    </div>
  );
};

export default Map;