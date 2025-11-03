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
  const probability = 0.05; // 25% 확률로 설치

  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (grid[y][x] !== WALL) continue;

      // 아래쪽으로 내려가며 연속된 벽 탐색
      let ny = y;
      while (ny + 1 < MAP_HEIGHT && grid[ny + 1][x] === WALL) ny++;

      // 맨 아래 벽만 Torch 후보
      if (ny + 1 < MAP_HEIGHT && grid[ny + 1][x] === FLOOR) {
        if (Math.random() < probability) {
          const [tx, ty] = TORCH_TILE;
          ctx.drawImage(
            img,
            tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
            x * TILE_SIZE * SCALE, ny * TILE_SIZE * SCALE,
            TILE_SIZE * SCALE, TILE_SIZE * SCALE
          );
        }
      }
    }
  }
}

function drawSkeletons(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const probability = 0.01; // 2% 정도. 더 드물게 하려면 0.01, 0.005 등으로 낮춰줘

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (grid[y][x] !== FLOOR) continue;       // 길에만 배치
      if (Math.random() >= probability) continue;

      const [tx, ty] = SKELETON_TILE;
      ctx.drawImage(
        img,
        tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE,
        TILE_SIZE * SCALE, TILE_SIZE * SCALE
      );
    }
  }
}

/** ====== 기존 drawTiles() 수정 ====== */
function drawTiles(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const [tx, ty] = (grid[y][x] === FLOOR) ? FLOOR_TILE : WALL_TILE;
      ctx.drawImage(
        img,
        tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE,
        x * TILE_SIZE * SCALE, y * TILE_SIZE * SCALE,
        TILE_SIZE * SCALE, TILE_SIZE * SCALE
      );
    }
  }

  drawTorches(grid, ctx, img);
  drawSkeletons(grid, ctx, img);
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
      <Character grid = { grid}/> {/* 캐릭터 추가 */}
    </div>
  );
};

export default Map;