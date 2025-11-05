// FILE: src/component/UI/GameVictory.tsx
import { useEffect, useState } from "react";
import "./GameVictory.css";

interface GameVictoryProps {
  onContinue: () => void;
  onMainMenu: () => void;
}

const GameVictory = ({ onContinue, onMainMenu }: GameVictoryProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleGameWin = () => {
      setIsVisible(true);
    };

    window.addEventListener("game-win", handleGameWin);

    return () => {
      window.removeEventListener("game-win", handleGameWin);
    };
  }, []);

  if (!isVisible) return null;

  const handleContinue = () => {
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent("reposition-mobs"));
    onContinue();
  };

  const handleMainMenu = () => {
    setIsVisible(false);
    onMainMenu();
  };

  return (
    <div className="victory-overlay">
      <div className="victory-container">
        <div className="victory-content">
          {/* ESCAPE 메인 타이틀 */}
          <div className="victory-escape-title">
            <span className="escape-letter">E</span>
            <span className="escape-letter">S</span>
            <span className="escape-letter">C</span>
            <span className="escape-letter">A</span>
            <span className="escape-letter">P</span>
            <span className="escape-letter">E</span>
          </div>

          <div className="victory-subtitle-wrapper">
            <div className="victory-shine-line"></div>
            <p className="victory-subtitle">탈출 성공!</p>
            <div className="victory-shine-line"></div>
          </div>

          <div className="victory-message">
            당신은 미로를 탈출했습니다!
          </div>

          <div className="victory-buttons">
            <button
              className="victory-button continue-btn"
              onClick={handleContinue}
            >
              <span className="button-icon">🎯</span>
              <span className="button-text">계속하기</span>
            </button>

            <button
              className="victory-button menu-btn"
              onClick={handleMainMenu}
            >
              <span className="button-icon">🏠</span>
              <span className="button-text">메인 메뉴</span>
            </button>
          </div>

          {/* 반짝이는 파티클 효과 */}
          <div className="victory-particles">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="victory-particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameVictory;