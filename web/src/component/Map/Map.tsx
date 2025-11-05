// FILE: src/component/Map/Map.tsx
import { useEffect, useRef, useState } from "react";
import type { Cell } from "../../type/type";
import { FLOOR, WALL } from "../../type/type";
import tileset from "../../assets/Dungeon_Tileset.png";
import Character from "../../component/mob/Character";
import Chaser from "../../component/mob/Chaser";
import Runner from "../../component/mob/Runner";
import Vision from "../../component/Map/Vision";
import ArrowOverlay from "../../component/Map/ArrowOverlay";
import "./Map.css";
import { DIFFICULTY } from "../../type/difficulty";

const TILE_SIZE = 16;
const SCALE = 2;
const MAP_WIDTH = 51;
const MAP_HEIGHT = 25;

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

function drawTiles(grid: Cell[][], ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  if (!grid?.length || !grid[0]?.length) return;
  ctx.imageSmoothingEnabled = false;
  const H = grid.length, W = grid[0].length;

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
  drawTorches(grid, ctx, img);
  drawSkeletons(grid, ctx, img);
}

interface MapProps { 
  grid: Cell[][],
  paused?: boolean;
}

const Map = ({ grid, paused }: MapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [visionRadius, setVisionRadius] = useState(DIFFICULTY[1].player.vision);

  useEffect(() => {
    const onDiff = (e: Event) => {
      const ce = e as CustomEvent<{ mode: number; config: typeof DIFFICULTY[1] }>;
      setVisionRadius(ce.detail.config.player.vision);
    };
    window.addEventListener("difficulty-set", onDiff as EventListener);
    return () => window.removeEventListener("difficulty-set", onDiff as EventListener);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!grid?.length || !grid[0]?.length) return;

    canvas.width = MAP_WIDTH * TILE_SIZE * SCALE;
    canvas.height = MAP_HEIGHT * TILE_SIZE * SCALE;

    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = imgRef.current!;
      drawTiles(grid, ctx, img);
    };

    if (!imgRef.current) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => draw();
      img.onerror = (e) => console.error("tileset load error", e);
      imgRef.current = img;
      img.src = tileset;
      if (img.complete && img.naturalWidth > 0) requestAnimationFrame(draw);
    } else {
      const img = imgRef.current;
      if (img.complete && img.naturalWidth > 0) requestAnimationFrame(draw);
      else img.onload = () => draw();
    }

    return () => { cancelled = true; };
  }, [grid]);

  return (
    <div id="Map" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        className="map-canvas"
        width={MAP_WIDTH * TILE_SIZE * SCALE}
        height={MAP_HEIGHT * TILE_SIZE * SCALE}
      />
      <Runner grid={grid} paused={paused} />
      <Character grid={grid} paused={paused} />
      <Chaser grid={grid} paused={paused} />
      <ArrowOverlay minDist={120} maxDist={1200} size={28} ring={36} />
      <Vision radius={visionRadius} feather={90} />
    </div>
  );
};

export default Map;
