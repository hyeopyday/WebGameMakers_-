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

import type { Item, ItemGrade } from "../type/Item/items";
import { B_ITEMS, S_ITEMS, pickRandom } from "../type/Item/items";

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
  const [items, setItems] = useState<Item[]>([]);

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

  function decideGrade(strike: number, ball: number, out: number): ItemGrade | null {
    // 조건 표 그대로 구현
    if ((strike === 1 && ball === 2 && out === 1) ||
      (strike === 2 && ball === 1 && out === 1)) {
      return "S";
    }
    if (strike === 0 && ball === 3 && out === 1) return "B";
    if (strike === 0 && ball === 0 && out === 4) return null;

    // (확장 규칙) S > B > O 우선순위 — 예외 케이스에 대비
    if (strike > 0) return "S";
    if (ball > 0) return "B";
    return null;
  }

  /** 인벤토리 삽입(가득 차면 맨 뒤 버리고 새로 추가) */
  function pushItem(newItem: Item) {
    setItems(prev => {
      if (prev.length < 3) return [...prev, newItem];
      // 꽉 찼으면 뒤(오른쪽) 제거 후 추가
      return [...prev.slice(0, 2), newItem];
    });
  }

  function useItem(item: Item) {
    switch (item.id) {
      case "SPEED_UP": {
        // 캐릭터 속도 6초 버프
        window.dispatchEvent(new CustomEvent("item-speed-up", { detail: { mult: 1.6, duration: 6000 } }));
        break;
      }
      case "RECOVERY": {
        // 체력 1 회복
        window.dispatchEvent(new CustomEvent("player-heal", { detail: { heal: 1 } }));
        break;
      }
      case "TELEPORT": {
        // 안전 스폰으로 순간이동
        window.dispatchEvent(new CustomEvent("item-teleport"));
        break;
      }
      case "VISIBILITY": {
        // 시야 8초 밝게
        window.dispatchEvent(new CustomEvent("item-visibility", { detail: { radius: 360, duration: 8000 } }));
        break;
      }
      case "BONDAGE": {
        // 적 속박 5초 (더 강력)
        window.dispatchEvent(new CustomEvent("item-bondage", { detail: { slow: 0.05, duration: 5000 } }));
        break;
      }
      case "KEY": {
        // 숫자 하나 공개(랜덤 인덱스)
        const idx = Math.floor(Math.random() * secret.length);
        const digit = secret[idx];
        alert(`힌트: #${idx + 1} 자리는 '${digit}' 입니다.`);
        break;
      }
    }
  }

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

  // 🔹 Item 사용 이벤트 수신 (E키 or 클릭)
  ///////✅
  useEffect(() => {
    const onUseItem = (e: Event) => {
      const ce = e as CustomEvent<{ slotIndex: number }>;
      const idx = ce.detail.slotIndex;
      setItems(prev => {
        if (idx < 0 || idx >= prev.length) return prev;
        const item = prev[idx];
        useItem(item);
        // 소비형 처리: 사용 후 제거
        return prev.filter((_, i) => i !== idx);
      });
    };
    window.addEventListener("use-item", onUseItem as EventListener);
    return () => window.removeEventListener("use-item", onUseItem as EventListener);
  }, [secret]);
  ///////

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
      window.dispatchEvent(new CustomEvent("game-win"));
      return;
    }

    const grade = decideGrade(res.result.strike, res.result.ball, res.result.out);
    if (grade) {
      const item = grade === "S" ? pickRandom(S_ITEMS) : pickRandom(B_ITEMS);
      pushItem(item);
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

  const handleResume = () => { setPaused(false); };
  const handleSettings = () => { setIsSettingsOpen(true); };
  const handleRestart = () => {
    setPaused(false);
    setAttemptCount(0);
    setHistory([]);
    setItems([]);                         // 인벤 초기화
    setSecret(generateSecret(length));    // 비밀 갱신
    window.dispatchEvent(new CustomEvent("reset-hp"));
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
      <ItemSlots items={items} />

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