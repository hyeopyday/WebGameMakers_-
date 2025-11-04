// FILE: src/overlay/ArrowOverlay.tsx
import { useEffect, useRef } from "react";
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from "../../type/type";

interface ArrowOverlayProps {
  minDist?: number;  // 이 거리 이하는 진한 빨강
  maxDist?: number;  // 이 거리 이상은 노랑
  size?: number;     // 화살표 길이(px)
  ring?: number;     // 플레이어 중심에서의 오프셋 거리(px)
}

const ArrowOverlay = ({
  minDist = 120,
  maxDist = 1200,
  size = 28,
  ring = 36,
}: ArrowOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
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
    canvas.style.backgroundColor = "transparent";
    canvas.style.zIndex = "10";

    const state = {
      px: W * 0.5,
      py: H * 0.5,
      rx: W * 0.5,
      ry: H * 0.5,
      haveRunner: false,
      lastTime: 0,
    };

    const onPlayerPos = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      state.px = ce.detail.x;
      state.py = ce.detail.y;
    };
    const onRunnerPos = (e: Event) => {
      const ce = e as CustomEvent<{ x: number; y: number }>;
      state.rx = ce.detail.x;
      state.ry = ce.detail.y;
      state.haveRunner = true;
    };

    window.addEventListener("player-pos", onPlayerPos as EventListener);
    window.addEventListener("runner-pos", onRunnerPos as EventListener);

    let raf = 0;
    const loop = (t: number) => {
      if (!state.lastTime) state.lastTime = t;
      state.lastTime = t;

      ctx.clearRect(0, 0, W, H);

      if (state.haveRunner) {
        const dx = state.rx - state.px;
        const dy = state.ry - state.py;
        const dist = Math.hypot(dx, dy);
        if (dist > 1e-3) {
          const angle = Math.atan2(dy, dx);

          // 색상 보간: 가까움=빨강(255,0,0) → 멀음=노랑(255,255,0)
          const clamp = (n: number, lo: number, hi: number) =>
            Math.max(lo, Math.min(hi, n));
          const tnorm = clamp((dist - minDist) / Math.max(1, maxDist - minDist), 0, 1);
          const g = Math.round(255 * tnorm); // 0→255
          const color = `rgb(255,${g},0)`;

          // 플레이어 주위 링에 배치해서 방향 가독성 증가
          const ox = Math.cos(angle) * ring;
          const oy = Math.sin(angle) * ring;
          const cx = state.px + ox;
          const cy = state.py + oy;

          // 화살표 그리기
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;

          // 삼각형 화살표: 앞쪽이 +x
          const half = size * 0.4;
          ctx.beginPath();
          ctx.moveTo(size, 0);          // 머리
          ctx.lineTo(-half, half);      // 꼬리 아래
          ctx.lineTo(-half, -half);     // 꼬리 위
          ctx.closePath();
          ctx.fill();

          // 중심점 표시선(옵션)
          // ctx.beginPath();
          // ctx.moveTo(-half, 0);
          // ctx.lineTo(size, 0);
          // ctx.stroke();

          ctx.restore();
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("player-pos", onPlayerPos as EventListener);
      window.removeEventListener("runner-pos", onRunnerPos as EventListener);
    };
  }, [minDist, maxDist, size, ring]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE * SCALE}
      height={MAP_HEIGHT * TILE_SIZE * SCALE}
    />
  );
};

export default ArrowOverlay;
