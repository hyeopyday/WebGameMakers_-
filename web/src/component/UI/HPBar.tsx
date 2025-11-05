// FILE: src/component/UI/HPBar.tsx
import { useEffect, useState } from "react";
import fullHP from "../../assets/FullHP.png";
import oneAttackHP from "../../assets/1AttackHP.png";
import twoAttackHP from "../../assets/2AttackHP.png";
import threeAttackHP from "../../assets/3AttackHP.png";
import "./HPBar.css";

const HPBar = () => {
  const [currentHP, setCurrentHP] = useState(3);

  useEffect(() => {
    const handlePlayerHit = () => {
      setCurrentHP((prev) => Math.max(0, prev - 1));
    };

    const handlePlayerDead = () => {
      setCurrentHP(0);
    };

    // 게임 재시작 또는 리셋 시 HP 초기화
    const handleResetHP = () => {
      setCurrentHP(3);
    };

    window.addEventListener("player-hit", handlePlayerHit);
    window.addEventListener("player-dead", handlePlayerDead);
    window.addEventListener("reset-hp", handleResetHP);

    return () => {
      window.removeEventListener("player-hit", handlePlayerHit);
      window.removeEventListener("player-dead", handlePlayerDead);
      window.removeEventListener("reset-hp", handleResetHP);
    };
  }, []);

  const getHPImage = () => {
    switch (currentHP) {
      case 3:
        return fullHP;
      case 2:
        return oneAttackHP;
      case 1:
        return twoAttackHP;
      case 0:
        return threeAttackHP;
      default:
        return fullHP;
    }
  };

  return (
    <div className="hp-bar-container">
      <img 
        src={getHPImage()} 
        alt={`HP: ${currentHP}/3`} 
        className="hp-bar-image"
      />
    </div>
  );
};

export default HPBar;