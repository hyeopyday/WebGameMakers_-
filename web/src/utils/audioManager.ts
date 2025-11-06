class AudioManager {
  private bgmVolume: number = 0.75;
  private sfxVolume: number = 0.75;
  private currentBGM: HTMLAudioElement | null = null;
  private bgmFadingOut: boolean = false;
  private sfxInstances: Set<HTMLAudioElement> = new Set();

  constructor() {
    try {
      const savedBGM = localStorage.getItem('audio:bgm-volume');
      const savedSFX = localStorage.getItem('audio:sfx-volume');
      if (savedBGM) this.bgmVolume = parseFloat(savedBGM);
      if (savedSFX) this.sfxVolume = parseFloat(savedSFX);
    } catch (e) {
      console.warn('Failed to load audio settings:', e);
    }
  }

  setBGMVolume(value: number) {
    this.bgmVolume = Math.max(0, Math.min(1, value / 20));
    if (this.currentBGM) {
      this.currentBGM.volume = this.bgmVolume;
    }
    try {
      localStorage.setItem('audio:bgm-volume', String(this.bgmVolume));
    } catch (e) {
      console.warn('Failed to save BGM volume:', e);
    }
  }

  setSFXVolume(value: number) {
    this.sfxVolume = Math.max(0, Math.min(1, value / 20));
    try {
      localStorage.setItem('audio:sfx-volume', String(this.sfxVolume));
    } catch (e) {
      console.warn('Failed to save SFX volume:', e);
    }
  }

  getBGMVolume(): number {
    return this.bgmVolume * 20;
  }

  getSFXVolume(): number {
    return this.sfxVolume * 20;
  }

  playBGM(src: string, fadeIn: boolean = false) {
    if (this.currentBGM && this.currentBGM.src.includes(src)) {
      return;
    }

    if (this.currentBGM && !this.bgmFadingOut) {
      this.stopBGM(true);
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = fadeIn ? 0 : this.bgmVolume;
    
    audio.play().catch(err => {
      console.warn('BGM autoplay blocked:', err);
    });

    if (fadeIn) {
      let vol = 0;
      const fadeInterval = setInterval(() => {
        vol += 0.05;
        if (vol >= this.bgmVolume) {
          vol = this.bgmVolume;
          clearInterval(fadeInterval);
        }
        audio.volume = vol;
      }, 50);
    }

    this.currentBGM = audio;
    this.bgmFadingOut = false;
  }

  stopBGM(fadeOut: boolean = false) {
    if (!this.currentBGM || this.bgmFadingOut) return;

    if (fadeOut) {
      this.bgmFadingOut = true;
      const audio = this.currentBGM;
      let vol = audio.volume;
      
      const fadeInterval = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          vol = 0;
          clearInterval(fadeInterval);
          audio.pause();
          audio.currentTime = 0;
          if (this.currentBGM === audio) {
            this.currentBGM = null;
          }
          this.bgmFadingOut = false;
        }
        audio.volume = Math.max(0, vol);
      }, 50);
    } else {
      this.currentBGM.pause();
      this.currentBGM.currentTime = 0;
      this.currentBGM = null;
      this.bgmFadingOut = false;
    }
  }

  pauseBGM() {
    if (this.currentBGM && !this.currentBGM.paused) {
      this.currentBGM.pause();
    }
  }

  resumeBGM() {
    if (this.currentBGM && this.currentBGM.paused) {
      this.currentBGM.play().catch(err => {
        console.warn('Failed to resume BGM:', err);
      });
    }
  }

  playSFX(src: string) {
    const audio = new Audio(src);
    audio.volume = this.sfxVolume;
    
    this.sfxInstances.add(audio);
    
    audio.addEventListener('ended', () => {
      this.sfxInstances.delete(audio);
    });
    
    audio.play().catch(err => {
      console.warn('SFX play failed:', err);
      this.sfxInstances.delete(audio);
    });
  }

  stopAll() {
    this.stopBGM(false);
    
    this.sfxInstances.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.sfxInstances.clear();
  }
}

export const audioManager = new AudioManager();