import { useEffect, useState } from "react";
import { audioManager } from "../../utils/audioManager";
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
      audioManager.stopBGM(false);
      audioManager.stopAll();
      
      window.dispatchEvent(new CustomEvent("reposition-mobs"));
      
      audioManager.playSFX("/sounds/game_over.mp3");
    };

    window.addEventListener("player-dead", handlePlayerDead);

    return () => {
      window.removeEventListener("player-dead", handlePlayerDead);
    };
  }, []);

  if (!isVisible) return null;

  const handleRestart = () => {
    audioManager.playSFX("/sounds/click.mp3");
    setIsVisible(false);
    audioManager.stopAll();
    window.dispatchEvent(new CustomEvent("reset-hp"));
    window.dispatchEvent(new CustomEvent("reposition-mobs"));
    
    setTimeout(() => {
      audioManager.playBGM("/sounds/playing_game.mp3", true);
    }, 300);
    
    onRestart();
  };

  const handleMainMenu = () => {
    audioManager.playSFX("/sounds/click.mp3");
    setIsVisible(false);
    audioManager.stopAll();
    
    setTimeout(() => {
      audioManager.playBGM("/sounds/main.mp3", true);
    }, 300);
    
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