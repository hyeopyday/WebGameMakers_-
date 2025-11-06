import { useEffect, useState } from "react";
import { audioManager } from "../utils/audioManager";
import NumberBaseball from "./NumberBaseball/NumberBaseball";
import PauseUI from "./PauseUI/PauseUI";
import SettingsUI from "./SettingsUI/SettingsUI";
import HPBar from "./UI/HPBar";
import ItemSlots from "./UI/ItemSlots";
import GameOver from "./UI/GameOver";
import GameVictory from "./UI/GameVictory";
import { MODE_LENGTH, generateSecret } from "../type/numberBaseball";
import { createGrid, carveMazeDFS, addSmallRooms, carveHighways, braidDeadEnds, openWallsForOpenness } from '../utils/gridGenerator';
import { type Cell, MAP_WIDTH, MAP_HEIGHT } from "../type/type";
import Map from "./Map/Map";
import { type Mode } from "../type/numberBaseball";
import "./Agency.css";

interface AgencyProps {
  difficulty: Mode;
  onMainMenu: () => void;
}

function Agency({ difficulty, onMainMenu }: AgencyProps) {
  const length = MODE_LENGTH[difficulty];
  const [secret] = useState(() => generateSecret(length));

  const [isPaused, setPaused] = useState(false);
  const [nbOpen, setNbOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [attemptCount, setAttemptCount] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const [grid, setGrid] = useState<Cell[][]>([]);

  useEffect(() => {
    audioManager.stopBGM(true);
    setTimeout(() => {
      audioManager.playBGM("/sounds/playing_game.mp3", true);
    }, 500);

    return () => {
      audioManager.stopBGM(false);
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("game.difficulty.mode", String(difficulty));
        console.log(`난이도 ${difficulty} 저장됨 (localStorage)`);
      }
    } catch (err) {
      console.warn("localStorage 접근 실패:", err);
    }
  }, [difficulty]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        window.dispatchEvent(new CustomEvent("game-win"));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    const onGamePaused = () => {
      setPaused(true);
      audioManager.pauseBGM();
    };
    const onGameResumed = () => {
      setPaused(false);
      audioManager.resumeBGM();
    };

    window.addEventListener("game-paused", onGamePaused);
    window.addEventListener("game-resumed", onGameResumed);

    return () => {
      window.removeEventListener("game-paused", onGamePaused);
      window.removeEventListener("game-resumed", onGameResumed);
    };
  }, []);

  useEffect(() => {
    const onCollide = () => {
      setPaused(true);
      setNbOpen(true);
    };
    window.addEventListener("enemyA-collide", onCollide as EventListener);
    return () => window.removeEventListener("enemyA-collide", onCollide as EventListener);
  }, []);

  useEffect(() => {
    const onGameWin = () => {
      setPaused(true);
      audioManager.stopBGM(true);
    };
    window.addEventListener("game-win", onGameWin);
    return () => window.removeEventListener("game-win", onGameWin);
  }, []);

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

    if (res.win) {
      console.log("숫자야구 승리! 게임 클리어!");
      window.dispatchEvent(new CustomEvent("game-win"));
      return;
    }

    window.dispatchEvent(new CustomEvent("reposition-mobs"));
  };

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
    setPaused(false);
    setAttemptCount(0);
    setHistory([]);
    audioManager.playBGM("/sounds/playing_game.mp3", true);
  };

  const handleMainMenuFromAgency = () => {
    audioManager.stopBGM(true);
    setTimeout(() => {
      audioManager.playBGM("/sounds/main.mp3", true);
    }, 500);
    onMainMenu();
  };

  return (
    <div id="Agency">
      <div className="hp-bar">
        <HPBar />
      </div>
      <ItemSlots />

      <div className="game-display">
        <Map grid={grid} paused={isPaused} />
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
        {history.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No attempts yet.</div>
        ) : (
          history.map((line, i) => <div className="history" key={i}>{line}</div>)
        )}
      </div>

      <PauseUI
        onResume={handleResume}
        onMainMenu={handleMainMenuFromAgency}
        onSettings={handleSettings}
      />

      <SettingsUI isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <GameOver onRestart={handleRestart} onMainMenu={handleMainMenuFromAgency} />

      <GameVictory onMainMenu={handleMainMenuFromAgency} />
    </div>
  );
}

export default Agency;