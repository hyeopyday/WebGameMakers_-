import { useState, useEffect } from "react";
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from "../../type/type";
import titleImg from "../../assets/title.png";
import difficultyImg from "../../assets/difficulty.png";
import backgroundImg from "../../assets/background.png";
import gameInfoImg from "../../assets/game_info.png";
import settingsBgImg from "../../assets/Settings2.png";
import volIconImg from "../../assets/vol.png";
import musIconImg from "../../assets/mus.png";
import barGreenImg from "../../assets/bar_green.png";
import barBrownImg from "../../assets/bar_brown.png";
import checkboxBrownImg from "../../assets/checkbox_brown.png";
import checkboxGreenImg from "../../assets/checkbox_green.png";
import langButtonImg from "../../assets/lang_button.png";
import "./MainMenu.css";

interface MainMenuProps {
  onStartGame: (difficulty: "normal" | "hard" | "hell") => void;
}

const MainMenu = ({ onStartGame }: MainMenuProps) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [bgmVolume, setBgmVolume] = useState(15);
  const [sfxVolume, setSfxVolume] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWindowMode, setIsWindowMode] = useState(true);
  const [language, setLanguage] = useState<"ko" | "en" | "ja">("ko");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // 다국어 지원
  const translations = {
    ko: {
      gameStart: "게임 시작",
      gameInfo: "게임 설명",
      settings: "설정",
      normal: "보통",
      hard: "어려움",
      hell: "헬",
      bgm: "배경음악",
      sfx: "효과음",
      fullscreen: "전체화면",
      windowMode: "윈도우 모드",
      language: "언어",
      escHint: "ESC 키를 눌러 돌아가기",
    },
    en: {
      gameStart: "Game Start",
      gameInfo: "How to Play",
      settings: "Settings",
      normal: "Normal",
      hard: "Hard",
      hell: "Hell",
      bgm: "BGM",
      sfx: "SFX",
      fullscreen: "Full Screen",
      windowMode: "Window Mode",
      language: "Language",
      escHint: "Press ESC to go back",
    },
    ja: {
      gameStart: "ゲーム開始",
      gameInfo: "遊び方",
      settings: "設定",
      normal: "普通",
      hard: "難しい",
      hell: "地獄",
      bgm: "BGM",
      sfx: "効果音",
      fullscreen: "全画面",
      windowMode: "ウィンドウモード",
      language: "言語",
      escHint: "ESCキーで戻る",
    },
  };

  const t = translations[language];

  useEffect(() => {
    // 타이틀 애니메이션 시작
    setTimeout(() => setShowTitle(true), 100);
    // 타이틀 애니메이션 완료 후 메뉴 버튼 표시
    setTimeout(() => setShowMenu(true), 1500);
  }, []);

  // ESC 키 이벤트 핸들러
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLanguageDropdown) {
          // 언어 드롭다운 열려있으면 닫기
          setShowLanguageDropdown(false);
        } else if (showDifficulty || showGameInfo || showSettings) {
          // 모달 닫기
          setIsClosing(true);
          setTimeout(() => {
            setShowDifficulty(false);
            setShowGameInfo(false);
            setShowSettings(false);
            setIsClosing(false);
          }, 500);
        }
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showDifficulty, showGameInfo, showSettings, showLanguageDropdown]);

  const handleGameStart = () => {
    setShowDifficulty(true);
    setIsClosing(false);
  };

  const handleGameInfo = () => {
    setShowGameInfo(true);
    setIsClosing(false);
  };

  const handleSettings = () => {
    setShowSettings(true);
    setIsClosing(false);
  };

  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      // 전체화면으로 전환
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
      setIsFullscreen(true);
      setIsWindowMode(false);
    }
  };

  const handleWindowModeToggle = () => {
    if (isFullscreen && document.fullscreenElement) {
      // 윈도우 모드로 전환
      document.exitFullscreen();
      setIsFullscreen(false);
      setIsWindowMode(true);
    }
  };

  const handleLanguageSelect = (lang: "ko" | "en" | "ja") => {
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

  const getLanguageName = (lang: "ko" | "en" | "ja") => {
    const names = {
      ko: "한국어",
      en: "ENGLISH",
      ja: "日本語",
    };
    return names[lang];
  };

  const handleDifficultySelect = (difficulty: "normal" | "hard" | "hell") => {
    onStartGame(difficulty);
  };

  const canvasWidth = MAP_WIDTH * TILE_SIZE * SCALE;
  const canvasHeight = MAP_HEIGHT * TILE_SIZE * SCALE;

  return (
    <div
      className="main-menu-container"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: `brightness(${brightness}%)`,
      }}
    >
      {/* 타이틀 이미지 */}
      <div className={`title-wrapper ${showTitle ? "show" : ""}`}>
        <img src={titleImg} alt="Title" className="title-image" />
      </div>

      {/* 메인 메뉴 버튼들 */}
      {showMenu && !showDifficulty && !showGameInfo && !showSettings && (
        <div className="menu-buttons">
          <button 
            className="menu-button"
            onClick={handleGameStart}
          >
            {t.gameStart}
          </button>
          <button 
            className="menu-button"
            onClick={handleGameInfo}
          >
            {t.gameInfo}
          </button>
          <button 
            className="menu-button"
            onClick={handleSettings}
          >
            {t.settings}
          </button>
        </div>
      )}

      {/* 난이도 선택 오버레이 */}
      {showDifficulty && (
        <>
          <div className={`difficulty-overlay ${isClosing ? "closing" : ""}`} />
          <div className={`difficulty-modal ${isClosing ? "closing" : ""}`}>
            <div className="difficulty-title-wrapper">
              <img
                src={difficultyImg}
                alt="난이도"
                className="difficulty-title"
              />
            </div>
            <div className="difficulty-buttons">
              <button
                className="difficulty-button"
                onClick={() => handleDifficultySelect("normal")}
              >
                {t.normal}
              </button>
              <button
                className="difficulty-button"
                onClick={() => handleDifficultySelect("hard")}
              >
                {t.hard}
              </button>
              <button
                className="difficulty-button"
                onClick={() => handleDifficultySelect("hell")}
              >
                {t.hell}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 게임 설명 오버레이 */}
      {showGameInfo && (
        <>
          <div className={`difficulty-overlay ${isClosing ? "closing" : ""}`} />
          <div className={`game-info-modal ${isClosing ? "closing" : ""}`}>
            <img
              src={gameInfoImg}
              alt="게임 설명"
              className="game-info-image"
            />
            <div className="esc-hint">{t.escHint}</div>
          </div>
        </>
      )}

      {/* 설정 오버레이 */}
      {showSettings && (
        <>
          <div className={`difficulty-overlay ${isClosing ? "closing" : ""}`} />
          <div className={`final-settings-modal ${isClosing ? "closing" : ""}`}>
            {/* 설정 배경 이미지 */}
            <img src={settingsBgImg} alt="" className="settings-bg-image" />


            {/* 닫기 버튼 */}
            <button
              className="settings-close-btn"
              onClick={() => {
                setIsClosing(true);
                setTimeout(() => {
                  setShowSettings(false);
                  setIsClosing(false);
                  setShowLanguageDropdown(false);
                }, 500);
              }}
            >
              ✕
            </button>

            {/* 설정 내용 */}
            <div className="final-settings-content">
              {/* 배경음악 */}
              <div className="final-settings-row">
                <img src={volIconImg} alt="" className="final-icon" />
                <div className="final-volume-bars">
                  {[...Array(20)].map((_, i) => (
                    <img
                      key={`bgm-${i}`}
                      src={i < bgmVolume ? barGreenImg : barBrownImg}
                      alt=""
                      className="final-bar"
                      onClick={() => setBgmVolume(i + 1)}
                    />
                  ))}
                </div>
              </div>

              {/* 효과음 */}
              <div className="final-settings-row">
                <img src={musIconImg} alt="" className="final-icon" />
                <div className="final-volume-bars">
                  {[...Array(20)].map((_, i) => (
                    <img
                      key={`sfx-${i}`}
                      src={i < sfxVolume ? barGreenImg : barBrownImg}
                      alt=""
                      className="final-bar"
                      onClick={() => setSfxVolume(i + 1)}
                    />
                  ))}
                </div>
              </div>

              {/* 전체화면 */}
              <div className="final-settings-row final-checkbox-row">
                <img
                  src={isFullscreen ? checkboxBrownImg : checkboxGreenImg}
                  alt=""
                  className="final-checkbox"
                  onClick={handleFullscreenToggle}
                />
                <span className="final-label">{t.fullscreen}</span>
              </div>

              {/* 윈도우 모드 */}
              <div className="final-settings-row final-checkbox-row">
                <img
                  src={isWindowMode ? checkboxBrownImg : checkboxGreenImg}
                  alt=""
                  className="final-checkbox"
                  onClick={handleWindowModeToggle}
                />
                <span className="final-label">{t.windowMode}</span>
              </div>

              {/* 언어 선택 */}
              <div className="final-settings-row final-language-row">
                <span className="final-language-title">{t.language}</span>
              </div>

              {/* 언어 버튼 (드롭다운 토글) */}
              <div className="final-language-select">
                <button
                  className="final-lang-button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  style={{ backgroundImage: `url(${langButtonImg})` }}
                >
                  <span className="final-lang-text">{getLanguageName(language)}</span>
                  <span className="final-lang-arrow">
                    {showLanguageDropdown ? "▲" : "▼"}
                  </span>
                </button>

                {/* 언어 드롭다운 */}
                {showLanguageDropdown && (
                  <div className="final-lang-dropdown">
                    <div
                      className={`final-lang-option ${language === "ko" ? "active" : ""}`}
                      onClick={() => handleLanguageSelect("ko")}
                    >
                      한국어
                    </div>
                    <div
                      className={`final-lang-option ${language === "en" ? "active" : ""}`}
                      onClick={() => handleLanguageSelect("en")}
                    >
                      ENGLISH
                    </div>
                    <div
                      className={`final-lang-option ${language === "ja" ? "active" : ""}`}
                      onClick={() => handleLanguageSelect("ja")}
                    >
                      日本語
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ESC 힌트 */}
            <div className="final-esc-hint">{t.escHint}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default MainMenu;