// GameOver.tsx
import { useEffect, useState } from "react";
import "./GameOver.css";
import gameoverImg from "../../assets/gameover/gameover.png";
import restartBtn from "../../assets/gameover/다시하기.png";
import mainMenuBtn from "../../assets/gameover/메인으로.png";

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
        <img 
          src={gameoverImg} 
          alt="Game Over" 
          className="gameover-title-image"
        />

        <div className="gameover-buttons">
          <button
            className="gameover-button restart-btn"
            onClick={handleRestart}
          >
            <img src={restartBtn} alt="다시하기" />
          </button>

          <button
            className="gameover-button mainmenu-btn"
            onClick={handleMainMenu}
          >
            <img src={mainMenuBtn} alt="메인으로" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;