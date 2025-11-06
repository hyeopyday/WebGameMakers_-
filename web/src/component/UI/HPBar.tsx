// HPBar.tsx
import { useEffect, useState } from "react";
import fullHP from "../../assets/FullHP.png";
import oneAttackHP from "../../assets/1AttackHP.png";
import twoAttackHP from "../../assets/2AttackHP.png";
import threeAttackHP from "../../assets/3AttackHP.png";
import "./HPBar.css";

const HPBar = () => {
  const [currentHP, setCurrentHP] = useState(3);
  const [isDamaged, setIsDamaged] = useState(false);

  useEffect(() => {
    const handlePlayerHit = () => {
      setCurrentHP((prev) => {
        const newHP = Math.max(0, prev - 1);
        
        // HP가 0이 되면 게임 오버 이벤트 발생
        if (newHP === 0) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("player-dead"));
          }, 100); // 약간의 딜레이 후 게임 오버
        }
        
        return newHP;
      });

      // 데미지 애니메이션
      setIsDamaged(true);
      setTimeout(() => setIsDamaged(false), 500);
    };

    // 게임 재시작 또는 리셋 시 HP 초기화
    const handleResetHP = () => {
      setCurrentHP(3);
      setIsDamaged(false);
    };

    window.addEventListener("player-hit", handlePlayerHit);
    window.addEventListener("reset-hp", handleResetHP);

    return () => {
      window.removeEventListener("player-hit", handlePlayerHit);
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
    <div className={`hp-bar-container ${isDamaged ? "damaged" : ""}`}>
      <img 
        src={getHPImage()} 
        alt={`HP: ${currentHP}/3`} 
        className="hp-bar-image"
      />
    </div>
  );
};

export default HPBar;