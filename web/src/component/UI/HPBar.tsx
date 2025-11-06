// src/component/UI/HPBar.tsx
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
        if (newHP === 0) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("player-dead"));
          }, 100);
        }
        return newHP;
      });
      setIsDamaged(true);
      setTimeout(() => setIsDamaged(false), 500);
    };

    const handleResetHP = () => {
      setCurrentHP(3);
      setIsDamaged(false);
    };

    const handleHeal = (e: Event) => {
      const ce = e as CustomEvent<{ heal?: number }>;
      const heal = Math.max(1, Math.floor(ce.detail?.heal ?? 1));
      setCurrentHP((prev) => Math.min(3, prev + heal));
    };

    window.addEventListener("player-hit", handlePlayerHit);
    window.addEventListener("reset-hp", handleResetHP);
    window.addEventListener("player-heal", handleHeal as EventListener);

    return () => {
      window.removeEventListener("player-hit", handlePlayerHit);
      window.removeEventListener("reset-hp", handleResetHP);
      window.removeEventListener("player-heal", handleHeal as EventListener);
    };
  }, []);

  const getHPImage = () => {
    switch (currentHP) {
      case 3: return fullHP;
      case 2: return oneAttackHP;
      case 1: return twoAttackHP;
      case 0: return threeAttackHP;
      default: return fullHP;
    }
  };

  return (
    <div className={`hp-bar-container ${isDamaged ? "damaged" : ""}`}>
      <img src={getHPImage()} alt={`HP: ${currentHP}/3`} className="hp-bar-image" />
    </div>
  );
};

export default HPBar;
