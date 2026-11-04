/**
 * High-Tech Procedural Music Synthesizer
 * Generates futuristic, electronic cyber-tech soundtracks using the Web Audio API.
 * Automatically synchronizes with Tactical AI Voice via smooth audio ducking (volume reduction & low-pass filter).
 * Selects a fresh distinct Tech track on every new session/connection to the platform.
 */

export interface TechTrack {
  id: string;
  name: string;
  subtitle: string;
  bpm: number;
  scale: number[]; // Frequencies for melodic arpeggios
  bassNote: number; // Base frequency for sub-bass
  style: 'cyberwave' | 'techno' | 'ambient-tech' | 'synthwave';
}

export const TECH_TRACKS: TechTrack[] = [
  {
    id: 'cyber-grid-2099',
    name: 'CYBER-GRID 2099',
    subtitle: 'Assaut Numérique & Synthèse Néon',
    bpm: 128,
    scale: [130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66, 329.63], // C minor / pentatonic tech
    bassNote: 65.41, // C2
    style: 'cyberwave',
  },
  {
    id: 'neo-dakar-synth',
    name: 'NEO-DAKAR SYNTHWAVE',
    subtitle: 'Rythmique Afro-Futuriste & Basse Solaire',
    bpm: 124,
    scale: [146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99], // D major / pentatonic
    bassNote: 73.42, // D2
    style: 'synthwave',
  },
  {
    id: 'quantum-pulse',
    name: 'QUANTUM PULSE PROTOCOL',
    subtitle: 'Cadence Tactique & Fréquence Pure',
    bpm: 132,
    scale: [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 293.66], // A minor
    bassNote: 55.0, // A1
    style: 'techno',
  },
  {
    id: 'orbital-satellite-07',
    name: 'ORBITAL SATELLITE 07',
    subtitle: 'Ambiance Cyber Spatiale & Nappes Électroniques',
    bpm: 120,
    scale: [164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0, 440.0], // E minor
    bassNote: 82.41, // E2
    style: 'ambient-tech',
  },
  {
    id: 'hyperdrive-matrix',
    name: 'HYPERDRIVE MATRIX',
    subtitle: 'Accélération Algorithmique Haute Vitesse',
    bpm: 134,
    scale: [123.47, 146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63], // B minor
    bassNote: 61.74, // B1
    style: 'techno',
  },
  {
    id: 'afro-cyber-circuit',
    name: 'AFRO-CYBER CIRCUIT',
    subtitle: 'Polyrhythm Électro & Marimba Quantique',
    bpm: 126,
    scale: [130.81, 155.56, 174.61, 196.0, 233.08, 261.63, 311.13, 349.23], // C dorian
    bassNote: 65.41, // C2
    style: 'synthwave',
  },
  {
    id: 'tactical-overdrive',
    name: 'TACTICAL OVERDRIVE',
    subtitle: 'Ondes Carrées & Pression Sub-Bass',
    bpm: 130,
    scale: [138.59, 164.81, 185.0, 207.65, 246.94, 277.18, 329.63, 369.99], // C# minor
    bassNote: 69.3, // C#2
    style: 'cyberwave',
  },
  {
    id: 'cyber-conqueror-2050',
    name: 'CYBER CONQUÉRANT 2050',
    subtitle: 'Ambiance 2050 Élite & Rythme Guerrier Bouker',
    bpm: 136,
    scale: [130.81, 146.83, 164.81, 196.0, 233.08, 261.63, 293.66, 349.23], // C minor warlord
    bassNote: 65.41,
    style: 'techno',
  },
  {
    id: 'bouker-warlord-2050',
    name: 'BOUKER WARLORD 2050',
    subtitle: 'Percussions Cybernétiques & Assaut Algorithmique',
    bpm: 132,
    scale: [123.47, 138.59, 164.81, 185.0, 220.0, 246.94, 277.18, 329.63], // B phrygian
    bassNote: 61.74,
    style: 'cyberwave',
  },
  {
    id: 'neo-apex-titan-2050',
    name: 'NÉO-APEX TITAN 2050',
    subtitle: 'Basses d\'Acier & Synthétiseur Triomphant',
    bpm: 130,
    scale: [110.0, 130.81, 146.83, 164.81, 196.0, 220.0, 261.63, 329.63], // A minor
    bassNote: 55.0,
    style: 'techno',
  },
  {
    id: 'matrix-souverain-2050',
    name: 'MATRIX SOUVERAIN 2050',
    subtitle: 'Cadence de Conquête 2050 & Onde de Choc',
    bpm: 134,
    scale: [146.83, 164.81, 196.0, 220.0, 246.94, 293.66, 329.63, 392.0], // D minor power
    bassNote: 73.42,
    style: 'cyberwave',
  },
  {
    id: 'souverain-digital',
    name: 'SOUVERAIN DIGITAL',
    subtitle: 'Cuivres Synthétiques & Gloire Impériale',
    bpm: 122,
    scale: [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0], // D minor
    bassNote: 73.42, // D2
    style: 'ambient-tech',
  },
];

class TechMusicService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;

  private isPlaying: boolean = false;
  private isDucked: boolean = false;
  private volume: number = 0.45; // Default ambient volume
  private isMuted: boolean = false;

  private currentTrack: TechTrack;
  private timerId: number | null = null;
  private step: number = 0;

  // Listeners for UI state updates (visualizer, track info, play state)
  private listeners: Set<(state: { isPlaying: boolean; track: TechTrack; isDucked: boolean; volume: number; isMuted: boolean }) => void> = new Set();

  constructor() {
    // Pick a fresh track per connection/session
    this.currentTrack = this.selectTrackForThisSession();
  }

  /**
   * Automatically picks a distinct track on every new connection or tab session
   */
  private selectTrackForThisSession(): TechTrack {
    try {
      const sessionTrackId = sessionStorage.getItem('afro_session_tech_track');
      if (sessionTrackId) {
        const found = TECH_TRACKS.find((t) => t.id === sessionTrackId);
        if (found) return found;
      }
    } catch {}

    // Pick a random track from the repertoire
    const randomTrack = TECH_TRACKS[Math.floor(Math.random() * TECH_TRACKS.length)];
    try {
      sessionStorage.setItem('afro_session_tech_track', randomTrack.id);
    } catch {}
    return randomTrack;
  }

  private initAudio() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      // Ducking gain (controls dynamic ducking when AI speaks)
      this.duckGain = this.ctx.createGain();
      this.duckGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Tech low-pass filter (warms up sound and cleans frequencies when ducked)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(8000, this.ctx.currentTime);

      // Connect graph: nodes -> filterNode -> duckGain -> masterGain -> destination
      this.filterNode.connect(this.duckGain);
      this.duckGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio not supported or failed to initialize:', e);
    }
  }

  /**
   * Start or toggle tech music playback
   */
  public async play(): Promise<void> {
    this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.step = 0;
    this.scheduleBeatLoop();
    this.notifyState();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.notifyState();
  }

  public toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Next Track - cycles through repertoire and switches smoothly
   */
  public nextTrack(): void {
    const currentIndex = TECH_TRACKS.findIndex((t) => t.id === this.currentTrack.id);
    const nextIndex = (currentIndex + 1) % TECH_TRACKS.length;
    this.currentTrack = TECH_TRACKS[nextIndex];
    try {
      sessionStorage.setItem('afro_session_tech_track', this.currentTrack.id);
    } catch {}
    this.step = 0;
    this.notifyState();
  }

  /**
   * Set specific track
   */
  public setTrack(trackId: string): void {
    const found = TECH_TRACKS.find((t) => t.id === trackId);
    if (found) {
      this.currentTrack = found;
      try {
        sessionStorage.setItem('afro_session_tech_track', this.currentTrack.id);
      } catch {}
      this.step = 0;
      this.notifyState();
    }
  }

  /**
   * DUCKING SYNCHRONIZATION WITH AI VOICE
   * When the AI speaks, music volume drops to ~18% and high-frequencies are filtered.
   */
  public duck(): void {
    if (!this.ctx || !this.duckGain || !this.filterNode) return;
    this.isDucked = true;
    const now = this.ctx.currentTime;
    
    // Smooth ramp down over 120ms
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);
    this.duckGain.gain.exponentialRampToValueAtTime(0.18, now + 0.12);

    // Warm low-pass filter to let voice shine through with maximum vocal clarity
    this.filterNode.frequency.cancelScheduledValues(now);
    this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
    this.filterNode.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    this.notifyState();
  }

  /**
   * UNDUCKING SYNCHRONIZATION
   * When the AI finishes speaking, music swells back up seamlessly.
   */
  public unduck(): void {
    if (!this.ctx || !this.duckGain || !this.filterNode) return;
    this.isDucked = false;
    const now = this.ctx.currentTime;

    // Smooth ramp up over 450ms
    this.duckGain.gain.cancelScheduledValues(now);
    this.duckGain.gain.setValueAtTime(this.duckGain.gain.value, now);
    this.duckGain.gain.exponentialRampToValueAtTime(1.0, now + 0.45);

    this.filterNode.frequency.cancelScheduledValues(now);
    this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, now);
    this.filterNode.frequency.exponentialRampToValueAtTime(8000, now + 0.5);

    this.notifyState();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notifyState();
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notifyState();
  }

  public getTrack(): TechTrack {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsDucked(): boolean {
    return this.isDucked;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public subscribe(cb: (state: { isPlaying: boolean; track: TechTrack; isDucked: boolean; volume: number; isMuted: boolean }) => void) {
    this.listeners.add(cb);
    cb({
      isPlaying: this.isPlaying,
      track: this.currentTrack,
      isDucked: this.isDucked,
      volume: this.volume,
      isMuted: this.isMuted,
    });
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notifyState() {
    const state = {
      isPlaying: this.isPlaying,
      track: this.currentTrack,
      isDucked: this.isDucked,
      volume: this.volume,
      isMuted: this.isMuted,
    };
    this.listeners.forEach((cb) => cb(state));
  }

  // =========================================================================
  // PROCEDURAL HIGH-TECH SEQUENCER (16-Step Cyber Beats & Arpeggios)
  // =========================================================================
  private scheduleBeatLoop() {
    if (!this.isPlaying || !this.ctx) return;

    const secondsPerBeat = 60 / this.currentTrack.bpm;
    const stepDuration = secondsPerBeat / 4; // 16th note steps

    this.playStep(this.step % 16);
    this.step++;

    this.timerId = window.setTimeout(() => {
      this.scheduleBeatLoop();
    }, stepDuration * 1000);
  }

  private playStep(stepIndex: number) {
    if (!this.ctx || !this.filterNode) return;
    const now = this.ctx.currentTime;
    const { scale, bassNote, style } = this.currentTrack;

    // 1. Kick on steps 0, 4, 8, 12 (Classic 4-on-the-floor cyber rhythm)
    if (stepIndex % 4 === 0) {
      this.triggerCyberKick(now);
    }

    // 2. Snare / Cyber Clap on steps 4, 12
    if (stepIndex === 4 || stepIndex === 12) {
      this.triggerCyberClap(now);
    }

    // 3. Cyber Hi-hat on off-beats (steps 2, 6, 10, 14) and 16th variations
    if (stepIndex % 2 === 0) {
      this.triggerHiHat(now, stepIndex % 4 === 2 ? 0.08 : 0.04);
    }

    // 4. Sub-Bassline (Synth Bass)
    if (stepIndex === 0 || stepIndex === 3 || stepIndex === 6 || stepIndex === 8 || stepIndex === 11 || stepIndex === 14) {
      const octaveMult = (stepIndex === 8 || stepIndex === 14) ? 1.5 : 1.0;
      this.triggerBass(now, bassNote * octaveMult, stepDurationFraction(style));
    }

    // 5. Melodic Cyber Arpeggiator (Synthesizer Lead)
    // Select notes from scale according to arpeggio pattern
    const scaleLen = scale.length;
    const noteIndex = (stepIndex * 3 + Math.floor(stepIndex / 4)) % scaleLen;
    const noteFreq = scale[noteIndex];

    // Play synth arp with lively stereo feel
    if (stepIndex % 2 === 1 || style === 'techno' || style === 'cyberwave') {
      this.triggerArpSynth(now, noteFreq, style);
    }

    // 6. Atmospheric Chord Pad on step 0 and 8
    if (stepIndex === 0 || stepIndex === 8) {
      const padChord = [scale[0], scale[2 % scaleLen], scale[4 % scaleLen]];
      this.triggerPad(now, padChord);
    }
  }

  // --- Drum Synthesizers ---
  private triggerCyberKick(time: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private triggerCyberClap(time: number) {
    if (!this.ctx || !this.filterNode) return;
    // White noise burst with bandpass
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(2.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + 0.15);
  }

  private triggerHiHat(time: number, vol: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000 + Math.random() * 1000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  // --- Bass Synthesizer ---
  private triggerBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  // --- Arpeggiated Lead Synth ---
  private triggerArpSynth(time: number, freq: number, style: string) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = style === 'ambient-tech' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.12);

    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  // --- Atmosphere Pad ---
  private triggerPad(time: number, chordFreqs: number[]) {
    if (!this.ctx || !this.filterNode) return;
    chordFreqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 2, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.04, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

      osc.connect(gain);
      gain.connect(this.filterNode!);

      osc.start(time);
      osc.stop(time + 1.9);
    });
  }
}

function stepDurationFraction(style: string): number {
  switch (style) {
    case 'ambient-tech':
      return 0.35;
    case 'synthwave':
      return 0.28;
    case 'cyberwave':
    case 'techno':
    default:
      return 0.22;
  }
}

export const techMusic = new TechMusicService();
