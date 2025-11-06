// GameVictory.tsx
import { useEffect, useState } from "react";
import "./GameVictory.css";
import victoryImg from "../../assets/victory.png";

interface GameVictoryProps {
  onContinue: () => void;
  onMainMenu: () => void;
}

const GameVictory = ({ onMainMenu }: GameVictoryProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleGameWin = () => {
      setIsVisible(true);
      
      // 5초 후 자동으로 메인 메뉴로 이동
      setTimeout(() => {
        setIsVisible(false);
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