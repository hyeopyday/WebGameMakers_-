// FILE: src/components/Character.tsx
import { useEffect, useRef } from "react";
import downPng from "../../assets/character_down.png";
import leftPng from "../../assets/character_left.png";
import rightPng from "../../assets/character_right.png";
import upPng from "../../assets/character_up.png";
import downLeftPng from "../../assets/character_down_left.png";
import downRightPng from "../../assets/character_down_right.png";
import upLeftPng from "../../assets/character_up_left.png";
import upRightPng from "../../assets/character_up_right.png";
import { MAP_WIDTH, MAP_HEIGHT, SCALE, TILE_SIZE } from "../../type/type";
import type { Cell } from "../../type/type";

const FRAMES = 4;
const MOVE_SPEED = 200;
const ANIM_FPS = 10;

interface CharacterProps {
  grid: Cell[][];
}

const DIR = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
  DOWN_LEFT: 4,
  DOWN_RIGHT: 5,
  UP_LEFT: 6,
  UP_RIGHT: 7,
} as const;

type DirType = typeof DIR[keyof typeof DIR];

const Character = ({ grid }: CharacterProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.pointerEvents = "none";
    // @ts-ignore
    canvas.style.imageRendering = "pixelated";
    canvas.style.backgroundColor = "transparent";

    const WORLD_W = MAP_WIDTH * TILE_SIZE * SCALE;
    const WORLD_H = MAP_HEIGHT * TILE_SIZE * SCALE;
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;

    const imgs: Record<number, HTMLImageElement> = {
      [DIR.DOWN]: new Image(),
      [DIR.LEFT]: new Image(),
      [DIR.RIGHT]: new Image(),
      [DIR.UP]: new Image(),
      [DIR.DOWN_LEFT]: new Image(),
      [DIR.DOWN_RIGHT]: new Image(),
      [DIR.UP_LEFT]: new Image(),
      [DIR.UP_RIGHT]: new Image(),
    };
    imgs[DIR.DOWN].src = downPng;
    imgs[DIR.LEFT].src = leftPng;
    imgs[DIR.RIGHT].src = rightPng;
    imgs[DIR.UP].src = upPng;
    imgs[DIR.DOWN_LEFT].src = downLeftPng;
    imgs[DIR.DOWN_RIGHT].src = downRightPng;
    imgs[DIR.UP_LEFT].src = upLeftPng;
    imgs[DIR.UP_RIGHT].src = upRightPng;

    const state = {
      px: 200,
      py: 200,
      dir: DIR.DOWN as DirType,
      frame: 0,
      accAnim: 0,
      lastTime: 0,
      key: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        w: false,
        a: false,
        s: false,
        d: false,
      },
      spaceHeld: false,
      effects: [] as { x: number; y: number; t: number; life: number }[],
    };

    const useItem = () => {
      window.dispatchEvent(new CustomEvent("use-item"));
      state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.35 });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      console.log('KeyDown:', e.key, e.code);
      
      if (e.code === "Space") {
        e.preventDefault();
        if (!state.spaceHeld) {
          state.spaceHeld = true;
          useItem();
        }
        return;
      }
      const k = e.key as keyof typeof state.key;
      if (k in state.key) {
        e.preventDefault();
        state.key[k] = true;
        console.log('Key set to true:', k);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        state.spaceHeld = false;
        return;
      }
      const k = e.key as keyof typeof state.key;
      if (k in state.key) {
        e.preventDefault();
        state.key[k] = false;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    const octantToDir: DirType[] = [
      DIR.LEFT,
      DIR.DOWN_LEFT,
      DIR.DOWN,
      DIR.DOWN_RIGHT,
      DIR.RIGHT,
      DIR.UP_RIGHT,
      DIR.UP,
      DIR.UP_LEFT,
    ];

    const angleToOctant = (theta: number) => {
      const step = Math.PI / 4;
      const idx = Math.round((theta + Math.PI) / step) % 8;
      return idx;
    };

    let raf = 0;

    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      const dt = Math.min(0.033, (t - state.lastTime) / 1000);
      state.lastTime = t;

      const upK = state.key.ArrowUp || state.key.w;
      const dnK = state.key.ArrowDown || state.key.s;
      const lfK = state.key.ArrowLeft || state.key.a;
      const rtK = state.key.ArrowRight || state.key.d;

      let vx = 0, vy = 0;
      if (upK) vy -= 1;
      if (dnK) vy += 1;
      if (lfK) vx -= 1;
      if (rtK) vx += 1;

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        vx = (vx / len) * MOVE_SPEED;
        vy = (vy / len) * MOVE_SPEED;

        const theta = Math.atan2(vy, vx);
        const oct = angleToOctant(theta);
        state.dir = octantToDir[oct];

        state.accAnim += dt;
        if (state.accAnim >= 1 / ANIM_FPS) {
          state.frame = (state.frame + 1) % FRAMES;
          state.accAnim = 0;
        }
      } else {
        vx = 0;
        vy = 0;
        state.frame = 0;
        state.accAnim = 0;
      }

      state.px += vx * dt;
      state.py += vy * dt;

      const img = imgs[state.dir];

      const frameW = img.naturalWidth > 0 ? Math.floor(img.naturalWidth / FRAMES) : 64;
      const frameH = img.naturalHeight > 0 ? img.naturalHeight : 64;

      const halfW = frameW / 2;
      const footY = frameH - 6;
      state.px = Math.max(halfW, Math.min(WORLD_W - halfW, state.px));
      state.py = Math.max(footY, Math.min(WORLD_H, state.py));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sx = (state.frame % FRAMES) * frameW;
      const sy = 0;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        sx, sy, frameW, frameH,
        Math.floor(state.px - frameW / 2),
        Math.floor(state.py - frameH + 6),
        frameW, frameH
      );

      for (let i = state.effects.length - 1; i >= 0; i--) {
        const e = state.effects[i];
        e.t += dt;
        if (e.t >= e.life) state.effects.splice(i, 1);
      }
      for (const e of state.effects) {
        const k = Math.min(1, e.t / e.life);
        const r = 16 + 64 * k;
        const alpha = 1 - k;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffaa";
        ctx.beginPath();
        ctx.arc(Math.floor(e.x), Math.floor(e.y - frameH / 2 + 6), r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    let loaded = 0;
    const tryStart = () => {
      loaded++;
      if (loaded === 8) raf = requestAnimationFrame(loop);
    };
    for (const k of Object.keys(imgs)) {
      const im = imgs[Number(k)];
      if (im.complete && im.naturalWidth > 0) tryStart();
      else im.onload = tryStart;
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
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

export default Character;