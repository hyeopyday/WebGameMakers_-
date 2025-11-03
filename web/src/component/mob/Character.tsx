import { useEffect, useRef } from "react";
import characterImg from "../../assets/character.png";

const FRAME_W = 64;
const FRAME_H = 64;
const FRAMES = 4;
const MOVE_SPEED = 200;
const ANIM_FPS = 10;

export default function Character() {
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
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key as keyof typeof state.key;
      if (k in state.key) state.key[k] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
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

  return <canvas ref={canvasRef} width={960} height={540} />;
}
