// FILE: src/components/Character.tsx
import { useEffect, useRef } from "react";
import downPng from "../../assets/character_up.png";
import leftPng from "../../assets/character_left.png";
import rightPng from "../../assets/character_right.png";
import upPng from "../../assets/character_down.png";
import downLeftPng from "../../assets/character_up_left.png";
import downRightPng from "../../assets/character_up_right.png";
import upLeftPng from "../../assets/character_down_left.png";
import upRightPng from "../../assets/character_down_right.png";

import type { Cell } from "../../type/type";
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  SCALE,
  TILE_SIZE,
  MOVE_SPEED,
  ANIM_FPS,
  SPRITE_SCALE,
  findSpawnPoint
} from "../../type/type";
import { moveWithWorldCollision } from "./Physic/Physic";
import { DIFFICULTY } from "../../type/difficulty";

const FRAMES = 4;

interface CharacterProps {
  grid: Cell[][];
  paused?: boolean;
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

let globalState: {
  px: number;
  py: number;
  initialized: boolean;
} | null = null;

const Character = ({ grid, paused }: CharacterProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!grid?.length || !grid[0]?.length) return;

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
      px: 0,
      py: 0,
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
      effects: [] as { x: number; y: number; t: number; life: number; kind?: "pulse" | "heal" | "blink" }[],
      hp: DIFFICULTY.playerMaxHP,
      maxHP: DIFFICULTY.playerMaxHP,
      invincibleUntil: 0,
      blinkPhase: 0,
      isDead: false,
      spaceHeld: false,
      speedMult: 1,
      speedUntil: 0,
      shieldUntil: 0,
    };

    if (!globalState || !globalState.initialized) {
      const spawn = findSpawnPoint(grid, { clearance: 0 });
      state.px = spawn.x;
      state.py = spawn.y;
      globalState = { px: spawn.x, py: spawn.y, initialized: true };
    } else {
      state.px = globalState.px;
      state.py = globalState.py;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (paused || state.isDead) { e.preventDefault(); return; }
      if (e.code === "Space") {
        e.preventDefault();
        if (!state.spaceHeld) {
          state.spaceHeld = true;
          // 필요 시 전역 아이템 사용 이벤트로 대체
          // window.dispatchEvent(new CustomEvent("use-item", { detail: { slotIndex: 0 } }));
        }
        return;
      }
      const k = e.key as keyof typeof state.key;
      if (k in state.key) {
        e.preventDefault();
        state.key[k] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (paused || state.isDead) { e.preventDefault(); return; }
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

    const onPlayerHit = (e: Event) => {
      const ce = e as CustomEvent<{ dmg?: number }>;
      if (state.hp <= 0 || state.isDead) return;
      const now = performance.now();
      if (now < state.invincibleUntil || now < state.shieldUntil) return;

      const dmg = Math.max(1, Math.floor(ce.detail?.dmg ?? 1));
      state.hp = Math.max(0, state.hp - dmg);
      state.invincibleUntil = now + 1000;

      
      if (state.hp === 0) {
        state.isDead = true;
        window.dispatchEvent(new CustomEvent("player-dead"));
      }
    };
    window.addEventListener("player-hit", onPlayerHit as EventListener);

    const onResetHP = () => {
      state.maxHP = DIFFICULTY.playerMaxHP;
      state.hp = state.maxHP;
      state.isDead = false;
      state.invincibleUntil = 0;

      const spawn = findSpawnPoint(grid, { clearance: 0 });
      state.px = spawn.x;
      state.py = spawn.y;
      if (globalState) {
        globalState.px = state.px;
        globalState.py = state.py;
      }
    };
    window.addEventListener("reset-hp", onResetHP);

    // ▼ 추가: ItemSlots에서 보내는 "use-item" 이벤트 수신
    const onUseItem = (e: Event) => {
      const ce = e as CustomEvent<{ slotIndex?: number }>;
      const slot = ce.detail?.slotIndex ?? 0;

      // 기본 이펙트: 원형 파동
      state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.4, kind: "pulse" });

      // 슬롯별 간단한 예시 동작 (필요 시 실제 아이템 로직으로 교체)
      if (slot === 0) {
        // 힐 이펙트 예시
        state.hp = Math.min(state.maxHP, state.hp + 1);
        state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.25, kind: "heal" });
      } else if (slot === 1) {
        // 짧은 무적 예시
        state.invincibleUntil = Math.max(state.invincibleUntil, performance.now() + 600);
        state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.25, kind: "blink" });
      }
      // slot === 2 등은 프로젝트 규칙에 맞춰 확장
    };

    const onSpeedUp = () => {
      const now = performance.now();
      state.speedMult = 1.6;        // 이동속도 1.6배
      state.speedUntil = now + 4000; // 4초
      state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.25, kind: "pulse" });
    };

    const onHeal = () => {
      state.hp = Math.min(state.maxHP, state.hp + 1);
      state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.25, kind: "heal" });
    };

    const onTeleport = () => {
      const spawn = findSpawnPoint(grid, { clearance: 0 });
      state.px = spawn.x; state.py = spawn.y;
      if (globalState) { globalState.px = state.px; globalState.py = state.py; }
      state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.25, kind: "blink" });
    };

    const onShield = () => {
      state.shieldUntil = performance.now() + 1500; // 1.5초 무적
      state.invincibleUntil = Math.max(state.invincibleUntil, state.shieldUntil);
      state.effects.push({ x: state.px, y: state.py, t: 0, life: 0.3, kind: "blink" });
    };


    window.addEventListener("use-item", onUseItem as EventListener);
    window.addEventListener("item-speedup", onSpeedUp);
    window.addEventListener("item-heal", onHeal);
    window.addEventListener("item-teleport", onTeleport);
    window.addEventListener("item-shield", onShield);

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

      const img = imgs[state.dir];
      const frameW = img.naturalWidth > 0 ? Math.floor(img.naturalWidth / FRAMES) : 64;
      const frameH = img.naturalHeight > 0 ? img.naturalHeight : 64;
      const destW = frameW * SPRITE_SCALE;
      const destH = frameH * SPRITE_SCALE;
      const destX = Math.floor(state.px - destW / 2);
      const destY = Math.floor(state.py - destH);

      if (paused || state.isDead) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;

        let skipDraw = false;
        if (state.invincibleUntil > performance.now()) {
          state.blinkPhase += dt * 20;
          skipDraw = Math.floor(state.blinkPhase) % 2 === 0;
        } else {
          state.blinkPhase = 0;
        }

        if (!skipDraw) {
          const sx = (state.frame % FRAMES) * frameW;
          const sy = 0;
          if (state.isDead) ctx.globalAlpha = 0.3;
          ctx.drawImage(img, sx, sy, frameW, frameH, destX, destY, destW, destH);
          if (state.isDead) ctx.globalAlpha = 1;
        }

        raf = requestAnimationFrame(loop);
        return;
      }

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
        const now = performance.now();
        if (now > state.speedUntil) {
          state.speedMult = 1;
          state.speedUntil = 0;
        }
        const MOVE = MOVE_SPEED * state.speedMult;
      
        const len = Math.hypot(vx, vy);
        vx = (vx / len) * MOVE;
        vy = (vy / len) * MOVE;
      
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

      const moved = moveWithWorldCollision(state.px, state.py, vx, vy, dt, grid);
      state.px = moved.x;
      state.py = moved.y;

      if (globalState) {
        globalState.px = state.px;
        globalState.py = state.py;
      }

      window.dispatchEvent(new CustomEvent("player-pos", { detail: { x: state.px, y: state.py } }));

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      let skipDraw = false;
      if (state.invincibleUntil > performance.now()) {
        state.blinkPhase += dt * 20;
        skipDraw = Math.floor(state.blinkPhase) % 2 === 0;
      } else {
        state.blinkPhase = 0;
      }

      if (!skipDraw) {
        const sx = (state.frame % FRAMES) * frameW;
        const sy = 0;
        ctx.drawImage(img, sx, sy, frameW, frameH, destX, destY, destW, destH);
      }

      // 이펙트 업데이트 및 렌더링
      for (let i = state.effects.length - 1; i >= 0; i--) {
        const e = state.effects[i];
        e.t += dt;
        if (e.t >= e.life) state.effects.splice(i, 1);
      }
      for (const e of state.effects) {
        const k = Math.min(1, e.t / e.life);

        if (e.kind === "heal") {
          ctx.save();
          ctx.globalAlpha = 1 - k;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#66ff99";
          ctx.beginPath();
          ctx.arc(Math.floor(e.x), Math.floor(e.y - destH / 2), 14 + 24 * k, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          continue;
        }

        if (e.kind === "blink") {
          ctx.save();
          ctx.globalAlpha = 0.6 * (1 - k);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#88ccff";
          ctx.strokeRect(
            Math.floor(e.x - 10 - 20 * k),
            Math.floor(e.y - destH / 2 - 10 - 20 * k),
            20 + 40 * k,
            20 + 40 * k
          );
          ctx.restore();
          continue;
        }

        // 기본 파동
        const r = 16 + 64 * k;
        const alpha = 1 - k;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffffaa";
        ctx.beginPath();
        ctx.arc(Math.floor(e.x), Math.floor(e.y - destH / 2), r, 0, Math.PI * 2);
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
      window.removeEventListener("player-hit", onPlayerHit as EventListener);
      window.removeEventListener("reset-hp", onResetHP);
      window.removeEventListener("use-item", onUseItem as EventListener);
      window.removeEventListener("item-speedup", onSpeedUp);
      window.removeEventListener("item-heal", onHeal);
      window.removeEventListener("item-teleport", onTeleport);
      window.removeEventListener("item-shield", onShield);
    };
  }, [grid, paused]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE * SCALE}
      height={MAP_HEIGHT * TILE_SIZE * SCALE}
    />
  );
};

export default Character;
