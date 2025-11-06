import { useState, useEffect } from "react";
import { audioManager } from "../../utils/audioManager";
import "./SettingsUI.css";

interface SettingsUIProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsUI = ({ isOpen, onClose }: SettingsUIProps) => {
  const [volume, setVolume] = useState(50);
  const [musicVolume, setMusicVolume] = useState(50);
  const [pixelPerfect, setPixelPerfect] = useState(true);
  const [showFPS, setShowFPS] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVolume(audioManager.getSFXVolume());
      setMusicVolume(audioManager.getBGMVolume());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVolume(value);
    audioManager.setSFXVolume(value);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMusicVolume(value);
    audioManager.setBGMVolume(value);
  };

  const handlePixelPerfectToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioManager.playSFX("/sounds/click.mp3");
    setPixelPerfect(e.target.checked);
  };

  const handleShowFPSToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioManager.playSFX("/sounds/click.mp3");
    setShowFPS(e.target.checked);
  };

  const handleApply = () => {
    audioManager.playSFX("/sounds/click.mp3");
    console.log("설정 적용:", { volume, musicVolume, pixelPerfect, showFPS });
    onClose();
  };

  const handleClose = () => {
    audioManager.playSFX("/sounds/click.mp3");
    onClose();
  };

  const handleCancel = () => {
    audioManager.playSFX("/sounds/click.mp3");
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleClose}>
      <div className="settings-container" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ 설정</h2>
          <button className="settings-close-btn" onClick={handleClose} aria-label="닫기">
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-group">
            <h3>🔊 오디오</h3>

            <div className="settings-item">
              <label htmlFor="volume">효과음 볼륨</label>
              <div className="slider-container">
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                />
                <span className="volume-display">{volume}%</span>
              </div>
            </div>

            <div className="settings-item">
              <label htmlFor="music-volume">음악 볼륨</label>
              <div className="slider-container">
                <input
                  id="music-volume"
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={handleMusicVolumeChange}
                />
                <span className="volume-display">{musicVolume}%</span>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <h3>🎨 그래픽</h3>

            <div className="settings-item checkbox-item">
              <label htmlFor="pixel-perfect">픽셀 퍼펙트</label>
              <div className="toggle-switch">
                <input
                  id="pixel-perfect"
                  type="checkbox"
                  checked={pixelPerfect}
                  onChange={handlePixelPerfectToggle}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>

            <div className="settings-item checkbox-item">
              <label htmlFor="show-fps">FPS 표시</label>
              <div className="toggle-switch">
                <input
                  id="show-fps"
                  type="checkbox"
                  checked={showFPS}
                  onChange={handleShowFPSToggle}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-cancel-btn" onClick={handleCancel}>
            취소
          </button>
          <button className="settings-apply-btn" onClick={handleApply}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsUI;