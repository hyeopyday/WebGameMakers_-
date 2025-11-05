import { useState, useEffect } from "react";
import "./PauseUI.css";

interface PauseUIProps {
  onResume: () => void;
  onMainMenu: () => void;
  onSettings: () => void;
}

const PauseUI = ({ onResume, onMainMenu, onSettings }: PauseUIProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent("game-paused"));
    } else {
      window.dispatchEvent(new CustomEvent("game-resumed"));
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleResume = () => {
    setIsVisible(false);
    onResume();
  };

  const handleMainMenu = () => {
    if (window.confirm("메인 메뉴로 돌아가시겠습니까? (진행 상황이 저장되지 않습니다)")) {
      setIsVisible(false);
      onMainMenu();
    }
  };

  return (
    <div className="pause-overlay">
      <div className="pause-container">
        <div className="pause-background">
          {/* 배경 이미지 */}
          <div className="pause-bg-placeholder">
            <div className="pause-text">
              <h2>일시정지</h2>
              <p className="pause-hint">ESC를 눌러 게임을 재개하세요</p>
            </div>
          </div>

          <div className="pause-buttons">
            <button
              className="pause-button home-btn"
              onClick={handleMainMenu}
              title="메인 메뉴"
              aria-label="메인 메뉴로 이동"
            >
              <div className="button-icon">🏠</div>
              <span className="button-label">Home</span>
            </button>

            <button
              className="pause-button settings-btn"
              onClick={onSettings}
              title="설정"
              aria-label="설정 열기"
            >
              <div className="button-icon">⚙️</div>
              <span className="button-label">Settings</span>
            </button>

            <button
              className="pause-button resume-btn"
              onClick={handleResume}
              title="재개"
              aria-label="게임 재개"
            >
              <div className="button-icon">▶️</div>
              <span className="button-label">Resume</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseUI;