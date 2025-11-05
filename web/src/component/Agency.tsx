import { useEffect, useState } from "react";
import NumberBaseball from "./NumberBaseball/NumberBaseball";
import PauseUI from "./PauseUI/PauseUI";
import SettingsUI from "./SettingsUI/SettingsUI";
import HPBar from "./UI/HPBar";
import GameOver from "./UI/GameOver";
import GameVictory from "./UI/GameVictory";
import { MODE_LENGTH, generateSecret } from "../type/numberBaseball";
import { createGrid, carveMazeDFS, addSmallRooms, carveHighways, braidDeadEnds, openWallsForOpenness } from '../utils/gridGenerator';
import { type Cell, MAP_WIDTH, MAP_HEIGHT } from "../type/type";
import Map from "./Map/Map";
import { type Mode } from "../type/numberBaseball";
import "./Agency.css";
// ... Map import 등
interface AgencyProps {
    difficulty: Mode;
    onMainMenu: () => void;
}

function Agency({ difficulty, onMainMenu }: AgencyProps) {
    const length = MODE_LENGTH[difficulty];
    const [secret, setSecret] = useState(() => generateSecret(length));

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

  // 플레이어 사망 이벤트 리스너
  useEffect(() => {
    const onPlayerDead = () => {
      setPaused(true);
    };
    window.addEventListener("player-dead", onPlayerDead);
    return () => window.removeEventListener("player-dead", onPlayerDead);
  }, []);

  // 게임 승리 이벤트 리스너
  useEffect(() => {
    const onGameWin = () => {
      setPaused(true);
    };
    window.addEventListener("game-win", onGameWin);
    return () => window.removeEventListener("game-win", onGameWin);
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
    
    // ✅ 숫자야구에서 승리했을 때 (4S = 완전 정답)
    if (res.win) {
      console.log("숫자야구 승리! 게임 클리어!");
      // 게임 승리 이벤트 발송
      window.dispatchEvent(new CustomEvent("game-win"));
      return;
    }
    
    // ✅ 숫자야구 종료 후 몹 재배치 이벤트 발송
    window.dispatchEvent(new CustomEvent("reposition-mobs"));
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

  const handleRestart = () => {
    // 게임 재시작 로직
    setPaused(false);
    setAttemptCount(0);
    setHistory([]);
  };

  const handleVictoryContinue = () => {
    // 승리 후 계속하기 - 새로운 숫자 생성
    setPaused(false);
    setAttemptCount(0);
    setHistory([]);
    setSecret(generateSecret(length));
    console.log("새로운 게임 시작!");
  };

  return (
    <div id="Agency">
        <div className="hp-bar">
            <HPBar />
        </div>

        <div className="game-display">
            <Map grid={grid} paused={isPaused} />
            {/* 모달 */}
            <NumberBaseball
                open={nbOpen}
                length={length}
                secret={secret}
                attemptIndex1={attemptCount + 1}
                onClose={handleClose}
                difficulty={difficulty}
                history={history}
            />
        </div>
        <div
            className="nb-history"
        >
            <h3>
                ⚾ Number Baseball ⚾
            </h3>
            {/* 여기에 시도 기록들 출력 */}
            {history.length === 0 ? (
                <div style={{ opacity: 0.6 }}>No attempts yet.</div>
            ) : (
                history.map((line, i) => <div className="history"  key={i}>{line}</div>)
            )}
        </div>

        {/* Pause UI */}
      <PauseUI
        onResume={handleResume}
        onMainMenu={onMainMenu}
        onSettings={handleSettings}
      />

      {/* Settings UI */}
      <SettingsUI isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Game Over Screen */}
      <GameOver onRestart={handleRestart} onMainMenu={onMainMenu} />

      {/* Game Victory Screen */}
      <GameVictory onContinue={handleVictoryContinue} onMainMenu={onMainMenu} />
    </div>
  );
}

export default Agency;