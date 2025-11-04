// FILE: src/overlay/Vision.tsx
import { useEffect, useRef } from "react";
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from "../../type/type";

interface VisionProps {
  radius?: number;   // 밝게 보이는 반경(px)
  feather?: number;  // 경계 페더(px)
}

const Vision = ({ radius = 200, feather = 90 }: VisionProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    canvas.style.zIndex = "9";       // 캐릭터/적 위, HUD 아래(필요시 조정)
    canvas.style.backgroundColor = "transparent";

    const state = {
      x: W * 0.5,
      y: H * 0.5,
      lastTime: 0,
    };

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

      // 전체 어둡게
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, W, H);

      // 플레이어 주변만 보이게 구멍
      ctx.globalCompositeOperation = "destination-out";
      const r0 = Math.max(0, radius - feather);
      const r1 = radius;
      const g = ctx.createRadialGradient(state.x, state.y, r0, state.x, state.y, r1);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(state.x, state.y, r1, 0, Math.PI * 2);
      ctx.fill();

      // 다음 프레임
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("player-pos", onPlayerPos as EventListener);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE * SCALE}
      height={MAP_HEIGHT * TILE_SIZE * SCALE}
    />
  );
};

export default Vision;
