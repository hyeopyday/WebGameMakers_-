import { useEffect, useState } from "react";
import { audioManager } from "../../utils/audioManager";
import "./GameVictory.css";
import victoryImg from "../../assets/victory.png";

interface GameVictoryProps {
  onMainMenu: () => void;
}

const GameVictory = ({ onMainMenu }: GameVictoryProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleGameWin = () => {
      setIsVisible(true);
      audioManager.stopBGM(true);
      audioManager.playSFX("/sounds/victory.mp3");
      
      setTimeout(() => {
        setIsVisible(false);
        audioManager.playBGM("/sounds/main.mp3", true);
        onMainMenu();
      }, 5000);
    };

    window.addEventListener("game-win", handleGameWin);

    return () => {
      window.removeEventListener("game-win", handleGameWin);
    };
  }, [onMainMenu]);

  if (!isVisible) return null;

  return (
    <div className="victory-overlay">
      <div className="victory-container">
        <img 
          src={victoryImg} 
          alt="Victory" 
          className="victory-image"
        />
      </div>
    </div>
  );
};

export default GameVictory;