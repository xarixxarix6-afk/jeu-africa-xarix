/**
 * Sound synthesis engine using Web Audio API
 * Generates tactile wooden clicks, heavy captures, chimes, dice rattles, and victory fanfares.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    const saved = localStorage.getItem('afro_salon_muted');
    if (saved) {
      this.isMuted = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('afro_salon_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Wood tap for regular piece move
  public playMove() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio fallback silent
    }
  }

  // Deep resonant wooden thud for captures
  public playCapture() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.18);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(this.ctx.currentTime + 0.18);
      osc2.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Audio fallback silent
    }
  }

  // Dice roll rattle sound
  public playDiceRoll() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const count = 4;
      for (let i = 0; i < count; i++) {
        const time = this.ctx.currentTime + i * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(300 + Math.random() * 250, time);
        osc.frequency.exponentialRampToValueAtTime(120, time + 0.035);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.035);
      }
    } catch {
      // Audio fallback silent
    }
  }

  // Golden royal chime for King / Dame promotion or special success
  public playPromotion() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const time = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.25);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Victory fanfare
  public playVictory() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const chord = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.9);
      });
    } catch {
      // Audio fallback silent
    }
  }

  // Realistic Gunshot synthesis per military weapon
  public playGunshot(weaponType: 'ak47' | 'm4a1' | 'awp' | 'deagle' | 'spas12' | string) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const time = this.ctx.currentTime;
      const duration = weaponType === 'awp' ? 0.35 : weaponType === 'spas12' ? 0.28 : 0.15;

      // 1. Noise burst (muzzle explosion)
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = weaponType === 'awp' ? 'lowpass' : 'bandpass';
      noiseFilter.frequency.setValueAtTime(weaponType === 'awp' ? 1200 : 2500, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(weaponType === 'awp' ? 0.8 : 0.6, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + duration);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(time);

      // 2. Low-frequency punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      const startFreq = weaponType === 'awp' ? 180 : weaponType === 'ak47' ? 160 : 130;
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + duration * 0.8);

      oscGain.gain.setValueAtTime(0.6, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.8);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + duration * 0.8);
    } catch {}
  }

  // Tactical reload sound (mag release + insert + slide)
  public playReload() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Click 1: mag out
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(800, t);
      osc1.frequency.exponentialRampToValueAtTime(300, t + 0.05);
      g1.gain.setValueAtTime(0.2, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc1.connect(g1);
      g1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.05);

      // Click 2: mag in (after 250ms)
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(450, t + 0.25);
      osc2.frequency.exponentialRampToValueAtTime(900, t + 0.32);
      g2.gain.setValueAtTime(0.25, t + 0.25);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc2.connect(g2);
      g2.connect(this.ctx.destination);
      osc2.start(t + 0.25);
      osc2.stop(t + 0.32);
    } catch {}
  }

  // Hitmarker sound (crisp tick when hitting opponent)
  public playHitMarker() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // Headshot sound (resonant chime + tick)
  public playHeadshot() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  // Scope zoom click
  public playScopeZoom() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {}
  }

  // Glider deployment & wind whoosh sound
  public playGliderDeploy() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.9);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    } catch {}
  }

  // Fortnite-style Wooden Wall/Ramp build placement thud
  public playBuildWood() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Hammer hit on plank
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);

      // Wooden resonance click
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(520, t + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(140, t + 0.14);
      g2.gain.setValueAtTime(0.2, t + 0.04);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc2.connect(g2);
      g2.connect(this.ctx.destination);
      osc2.start(t + 0.04);
      osc2.stop(t + 0.14);
    } catch {}
  }

  // Golden Legendary Chest Open Fanfare (Fortnite Chest shimmer)
  public playChestOpen() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major golden arpeggio
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const time = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.35);
      });
    } catch {}
  }
}

export const sound = new SoundService();
