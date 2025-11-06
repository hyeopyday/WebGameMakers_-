import { useState, useEffect } from "react";
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from "../../type/type";
import { audioManager } from "../../utils/audioManager";
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
import { type Mode } from "../../type/numberBaseball";
import { setDifficulty } from "../../type/difficulty";


interface MainMenuProps {
onStartGame: (mode: Mode) => void;}

const MainMenu = ({ onStartGame }: MainMenuProps) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showGameInfo, setShowGameInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [brightness] = useState(100);
  const [bgmVolume, setBgmVolume] = useState(15);
  const [sfxVolume, setSfxVolume] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWindowMode, setIsWindowMode] = useState(true);
  const [language, setLanguage] = useState<"ko" | "en" | "ja">("ko");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

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
    setTimeout(() => setShowTitle(true), 100);
    setTimeout(() => setShowMenu(true), 1500);
    
    audioManager.playBGM("/sounds/main.mp3", true);
    
    return () => {
      // 언마운트 시 BGM 유지
    };
  }, []);

  useEffect(() => {
    const savedBGM = audioManager.getBGMVolume();
    const savedSFX = audioManager.getSFXVolume();
    setBgmVolume(savedBGM);
    setSfxVolume(savedSFX);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLanguageDropdown) {
          setShowLanguageDropdown(false);
        } else if (showDifficulty || showGameInfo || showSettings) {
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
    audioManager.playSFX("/sounds/click.mp3");
    setShowDifficulty(true);
    setIsClosing(false);
  };

  const handleGameInfo = () => {
    audioManager.playSFX("/sounds/click.mp3");
    setShowGameInfo(true);
    setIsClosing(false);
  };

  const handleSettings = () => {
    audioManager.playSFX("/sounds/click.mp3");
    setShowSettings(true);
    setIsClosing(false);
  };

  const handleFullscreenToggle = () => {
    audioManager.playSFX("/sounds/click.mp3");
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
      setIsFullscreen(true);
      setIsWindowMode(false);
    }
  };

  const handleWindowModeToggle = () => {
    audioManager.playSFX("/sounds/click.mp3");
    if (isFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
      setIsWindowMode(true);
    }
  };

  const handleLanguageSelect = (lang: "ko" | "en" | "ja") => {
    audioManager.playSFX("/sounds/click.mp3");
    setLanguage(lang);
    setShowLanguageDropdown(false);
  };

const handleDifficultySelect = (mode: Mode) => {
  audioManager.playSFX("/sounds/click.mp3");
  setDifficulty(mode);
  onStartGame(mode);
};

  const handleBgmVolumeChange = (index: number) => {
    audioManager.playSFX("/sounds/click.mp3");
    const newVolume = index + 1;
    setBgmVolume(newVolume);
    audioManager.setBGMVolume(newVolume);
  };

  const handleSfxVolumeChange = (index: number) => {
    const newVolume = index + 1;
    setSfxVolume(newVolume);
    audioManager.setSFXVolume(newVolume);
    audioManager.playSFX("/sounds/click.mp3");
  };

  const getLanguageName = (lang: "ko" | "en" | "ja") => {
    const names = {
      ko: "한국어",
      en: "ENGLISH",
      ja: "日本語",
    };
    return names[lang];
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
      <div className={`title-wrapper ${showTitle ? "show" : ""}`}>
        <img src={titleImg} alt="Title" className="title-image" />
      </div>

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
                onClick={() => handleDifficultySelect(1)}
              >
                {t.normal}
              </button>
              <button
                className="difficulty-button"
                onClick={() => handleDifficultySelect(2)}
              >
                {t.hard}
              </button>
              <button
                className="difficulty-button"
                onClick={() => handleDifficultySelect(3)}
              >
                {t.hell}
              </button>
            </div>
          </div>
        </>
      )}

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

      {showSettings && (
        <>
          <div className={`difficulty-overlay ${isClosing ? "closing" : ""}`} />
          <div className={`final-settings-modal ${isClosing ? "closing" : ""}`}>
            <img src={settingsBgImg} alt="" className="settings-bg-image" />

            <button
              className="settings-close-btn"
              onClick={() => {
                audioManager.playSFX("/sounds/click.mp3");
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

            <div className="final-settings-content">
              <div className="final-settings-row">
                <img src={volIconImg} alt="" className="final-icon" />
                <div className="final-volume-bars">
                  {[...Array(20)].map((_, i) => (
                    <img
                      key={`bgm-${i}`}
                      src={i < bgmVolume ? barGreenImg : barBrownImg}
                      alt=""
                      className="final-bar"
                      onClick={() => handleBgmVolumeChange(i)}
                    />
                  ))}
                </div>
              </div>

              <div className="final-settings-row">
                <img src={musIconImg} alt="" className="final-icon" />
                <div className="final-volume-bars">
                  {[...Array(20)].map((_, i) => (
                    <img
                      key={`sfx-${i}`}
                      src={i < sfxVolume ? barGreenImg : barBrownImg}
                      alt=""
                      className="final-bar"
                      onClick={() => handleSfxVolumeChange(i)}
                    />
                  ))}
                </div>
              </div>

              <div className="final-settings-row final-checkbox-row">
                <img
                  src={isFullscreen ? checkboxBrownImg : checkboxGreenImg}
                  alt=""
                  className="final-checkbox"
                  onClick={handleFullscreenToggle}
                />
                <span className="final-label">{t.fullscreen}</span>
              </div>

              <div className="final-settings-row final-checkbox-row">
                <img
                  src={isWindowMode ? checkboxBrownImg : checkboxGreenImg}
                  alt=""
                  className="final-checkbox"
                  onClick={handleWindowModeToggle}
                />
                <span className="final-label">{t.windowMode}</span>
              </div>

              <div className="final-settings-row final-language-row">
                <span className="final-language-title">{t.language}</span>
              </div>

              <div className="final-language-select">
                <button
                  className="final-lang-button"
                  onClick={() => {
                    audioManager.playSFX("/sounds/click.mp3");
                    setShowLanguageDropdown(!showLanguageDropdown);
                  }}
                  style={{ backgroundImage: `url(${langButtonImg})` }}
                >
                  <span className="final-lang-text">{getLanguageName(language)}</span>
                  <span className="final-lang-arrow">
                    {showLanguageDropdown ? "▲" : "▼"}
                  </span>
                </button>

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

            <div className="final-esc-hint">{t.escHint}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default MainMenu;