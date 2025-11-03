import { useEffect, useRef } from "react";
import characterImg from "../../assets/character.png";
import { MAP_WIDTH, MAP_HEIGHT , SCALE, TILE_SIZE } from "../../type/type";
import type { Cell } from "../../type/type";

const FRAME_W = 64;
const FRAME_H = 64;
const FRAMES = 4;
const MOVE_SPEED = 200;
const ANIM_FPS = 10;


interface CharacterProps {
    grid : Cell[][];
}

const Character = ({grid} : CharacterProps ) =>  {
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

    const img = new Image();
    img.src = characterImg;

    const state = {
      px: 200,
      py: 200,
      dir: 0,
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
      if (e.code === "Space") {
        e.preventDefault();
        if (!state.spaceHeld) {
          state.spaceHeld = true;
          useItem();
        }
        return;
      }
      const k = e.key as keyof typeof state.key;
      if (k in state.key) state.key[k] = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        state.spaceHeld = false;
        return;
      }
      const k = e.key as keyof typeof state.key;
      if (k in state.key) state.key[k] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let SHEET_COLS = 1;
    let SHEET_ROWS = 1;

    let raf = 0;
    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      const dt = Math.min(0.033, (t - state.lastTime) / 1000);
      state.lastTime = t;

      const upK = state.key.ArrowUp || state.key.w;
      const dnK = state.key.ArrowDown || state.key.s;
      const lfK = state.key.ArrowLeft || state.key.a;
      const rtK = state.key.ArrowRight || state.key.d;

      let vx = 0,
        vy = 0;
      if (upK) vy -= 1;
      if (dnK) vy += 1;
      if (lfK) vx -= 1;
      if (rtK) vx += 1;

      if (vx !== 0 || vy !== 0) {
        const len = Math.hypot(vx, vy);
        vx = (vx / len) * MOVE_SPEED;
        vy = (vy / len) * MOVE_SPEED;

        if (Math.abs(vx) > Math.abs(vy)) state.dir = vx > 0 ? 2 : 1;
        else state.dir = vy > 0 ? 0 : 3;

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

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sx = (state.frame % SHEET_COLS) * FRAME_W;
      const sy = Math.min(state.dir, SHEET_ROWS - 1) * FRAME_H;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        sx,
        sy,
        FRAME_W,
        FRAME_H,
        Math.floor(state.px - FRAME_W / 2),
        Math.floor(state.py - FRAME_H + 6),
        FRAME_W,
        FRAME_H
      );

      // 효과 업데이트
      for (let i = state.effects.length - 1; i >= 0; i--) {
        const e = state.effects[i];
        e.t += dt;
        if (e.t >= e.life) state.effects.splice(i, 1);
      }

      // 효과 렌더링
      for (const e of state.effects) {
        const k = Math.min(1, e.t / e.life);
        const r = 16 + 64 * k;
        const alpha = 1 - k;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffaa";
        ctx.beginPath();
        ctx.arc(Math.floor(e.x), Math.floor(e.y - FRAME_H / 2 + 6), r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      SHEET_COLS = Math.max(1, Math.floor(img.width / FRAME_W));
      SHEET_ROWS = Math.max(1, Math.floor(img.height / FRAME_H));
      raf = requestAnimationFrame(loop);
    };

    if (img.complete) start();
    else img.onload = start;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return <canvas ref={canvasRef} width={MAP_WIDTH * TILE_SIZE * SCALE} height={MAP_HEIGHT * TILE_SIZE * SCALE} />;

}

  export default Character;