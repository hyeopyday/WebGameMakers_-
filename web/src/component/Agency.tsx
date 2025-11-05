import { useEffect, useState } from "react";
import NumberBaseball from "./NumberBaseball/NumberBaseball";
import PauseUI from "./PauseUI/PauseUI";
import SettingsUI from "./SettingsUI/SettingsUI";
import { MODE_LENGTH, generateSecret } from "../type/numberBaseball";
import { createGrid, carveMazeDFS, addSmallRooms, carveHighways, braidDeadEnds, openWallsForOpenness } from '../utils/gridGenerator';
import { type Cell, MAP_WIDTH, MAP_HEIGHT } from "../type/type";
import Map from "./Map/Map";
import { type Mode } from "../type/numberBaseball";

interface AgencyProps {
  difficulty: Mode;
  onMainMenu: () => void;
}

function Agency({ difficulty, onMainMenu }: AgencyProps) {
  const [mode] = useState<Mode>(difficulty);
  const length = MODE_LENGTH[mode];
  const [secret] = useState(() => generateSecret(length));

  const [isPaused, setPaused] = useState(false);
  const [nbOpen, setNbOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [attemptCount, setAttemptCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const [grid, setGrid] = useState<Cell[][]>([]);

  // 게임 일시정지 이벤트 리스너
  useEffect(() => {
    const onGamePaused = () => setPaused(true);
    const onGameResumed = () => setPaused(false);

    window.addEventListener("game-paused", onGamePaused);
    window.addEventListener("game-resumed", onGameResumed);

    return () => {
      window.removeEventListener("game-paused", onGamePaused);
      window.removeEventListener("game-resumed", onGameResumed);
    };
  }, []);

  // Runner 충돌 이벤트 리스너
  useEffect(() => {
    const onCollide = () => {
      setPaused(true);
      setNbOpen(true);
    };
    window.addEventListener("enemyA-collide", onCollide as EventListener);
    return () => window.removeEventListener("enemyA-collide", onCollide as EventListener);
  }, []);

  // 숫자야구 게임 종료 핸들러
  const handleClose = (res: {
    guess: string;
    result: { strike: number; ball: number; out: number };
    historyLine: string;
    win: boolean;
  } | null) => {
    setNbOpen(false);
    setPaused(false);
    if (!res) return;
    
    const idx = attemptCount + 1;
    setAttemptCount(idx);
    setHistory((prev) => [...prev, res.historyLine]);
    
    // ✅ 숫자야구 종료 후 몹 재배치 이벤트 발송
    window.dispatchEvent(new CustomEvent("reposition-mobs"));
    
    if (res.win) {
      alert("숫자야구 승리! 🎉");
    }
  };

  // 미로 생성
  useEffect(() => {
    const g = createGrid(MAP_WIDTH, MAP_HEIGHT);
    carveMazeDFS(g, 1, 1);

    switch (difficulty) {
      case 1:
        addSmallRooms(g, { count: 3 });
        carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
        braidDeadEnds(g, 0.28);
        openWallsForOpenness(g, 0.35);
        break;
      case 2:
        addSmallRooms(g, { count: 2 });
        carveHighways(g, { horiz: 1, vert: 1, thickness: 1 });
        braidDeadEnds(g, 0.15);
        openWallsForOpenness(g, 0.2);
        break;
      case 3:
        addSmallRooms(g, { count: 1 });
        braidDeadEnds(g, 0.05);
        openWallsForOpenness(g, 0.1);
        break;
    }

    setGrid(g);
  }, [difficulty]);

  const handleResume = () => {
    console.log("게임 재개");
    setPaused(false);
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {/* 게임 맵 */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <Map grid={grid} paused={isPaused || nbOpen} />
      </div>

      {/* 숫자야구 히스토리 - history가 있을 때만 표시 */}
      {history.length > 0 && (
        <div
          id="nb-history"
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "12px 16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.5",
            maxHeight: "200px",
            width: "240px",
            overflowY: "auto",
            boxShadow: "0 0 10px rgba(0,0,0,0.8)",
            zIndex: 1000,
            border: "2px solid #8b6f47",
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: "16px", borderBottom: "1px solid #888", color: "#f4e4c1" }}>
            ⚾ Number Baseball
          </h3>
          {history.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      {/* 숫자야구 모달 */}
      <NumberBaseball
        open={nbOpen}
        length={length}
        secret={secret}
        attemptIndex1={attemptCount + 1}
        onClose={handleClose}
        history={history}
      />

      {/* Pause UI */}
      <PauseUI
        onResume={handleResume}
        onMainMenu={onMainMenu}
        onSettings={handleSettings}
      />

      {/* Settings UI */}
      <SettingsUI isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default Agency;