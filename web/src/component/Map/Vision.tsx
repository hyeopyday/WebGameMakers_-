// src/component/Map/Vision.tsx
import { useEffect, useRef, useState } from "react";
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from "../../type/type";

interface VisionProps {
  radius?: number;
  feather?: number;
}

const Vision = ({ radius = 200, feather = 90 }: VisionProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🔹 버프 반영 가능한 상태
  const [rad, setRad] = useState(radius);
  const [until, setUntil] = useState(0);

  useEffect(() => {
    const onVis = (e: Event) => {
      const ce = e as CustomEvent<{ radius?: number; duration?: number }>;
      const addR = ce.detail?.radius ?? 320;
      const dur = ce.detail?.duration ?? 6000;
      setRad(addR);
      setUntil(performance.now() + dur);
      setTimeout(() => {
        // 타임아웃 후 자동 복귀(안전장치)
        setRad(radius);
        setUntil(0);
      }, dur + 20);
    };
    window.addEventListener("item-visibility", onVis as EventListener);
    return () => window.removeEventListener("item-visibility", onVis as EventListener);
  }, [radius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = MAP_WIDTH * TILE_SIZE * SCALE;
    const H = MAP_HEIGHT * TILE_SIZE * SCALE;
    canvas.width = W;
    canvas.height = H;

    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.pointerEvents = "none";
    // @ts-ignore
    canvas.style.imageRendering = "pixelated";
    canvas.style.zIndex = "9";
    canvas.style.backgroundColor = "transparent";

    const state = { x: W * 0.5, y: H * 0.5, lastTime: 0 };

    const onPlayerPos = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      state.x = ce.detail.x;
      state.y = ce.detail.y;
    };
    window.addEventListener("player-pos", onPlayerPos as EventListener);

    let raf = 0;
    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      state.lastTime = t;

      // 버프 시간 지났으면 원복
      if (until && performance.now() > until) {
        setRad(radius);
        setUntil(0);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "destination-out";
      const r0 = Math.max(0, rad - feather);
      const r1 = rad;
      const g = ctx.createRadialGradient(state.x, state.y, r0, state.x, state.y, r1);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(state.x, state.y, r1, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("player-pos", onPlayerPos as EventListener);
    };
  }, [rad, feather]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE * SCALE}
      height={MAP_HEIGHT * TILE_SIZE * SCALE}
    />
  );
};

export default Vision;
