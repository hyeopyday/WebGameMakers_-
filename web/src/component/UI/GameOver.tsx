// FILE: src/component/UI/GameOver.tsx
import { useEffect, useState } from "react";
import "./GameOver.css";

interface GameOverProps {
  onRestart: () => void;
  onMainMenu: () => void;
}

const GameOver = ({ onRestart, onMainMenu }: GameOverProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handlePlayerDead = () => {
      setIsVisible(true);
    };

    window.addEventListener("player-dead", handlePlayerDead);

    return () => {
      window.removeEventListener("player-dead", handlePlayerDead);
    };
  }, []);

  if (!isVisible) return null;

  const handleRestart = () => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent("reset-hp"));
    window.dispatchEvent(new CustomEvent("reposition-mobs"));
    onRestart();
  };

  const handleMainMenu = () => {
    setIsVisible(false);
    onMainMenu();
  };

  return (
    <div className="gameover-overlay">
      <div className="gameover-container">
        <div className="gameover-content">
          <h1 className="gameover-title">게임 오버</h1>
          <p className="gameover-subtitle">당신은 패배했습니다</p>

          <div className="gameover-buttons">
            <button
              className="gameover-button restart-btn"
              onClick={handleRestart}
            >
              <span className="button-icon">🔄</span>
              <span className="button-text">재도전</span>
            </button>

            <button
              className="gameover-button menu-btn"
              onClick={handleMainMenu}
            >
              <span className="button-icon">🏠</span>
              <span className="button-text">메인 메뉴</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;