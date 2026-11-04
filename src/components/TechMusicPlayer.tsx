import React, { useState, useEffect } from 'react';
import { techMusic, TechTrack } from '../services/techMusicService';
import { Play, Pause, SkipForward, Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';

export const TechMusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState<TechTrack>(techMusic.getTrack());
  const [isDucked, setIsDucked] = useState(false);
  const [volume, setVolume] = useState(techMusic.getVolume());
  const [isMuted, setIsMuted] = useState(techMusic.getIsMuted());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = techMusic.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setTrack(state.track);
      setIsDucked(state.isDucked);
      setVolume(state.volume);
      setIsMuted(state.isMuted);
    });
    return unsubscribe;
  }, []);

  const handleTogglePlay = () => {
    techMusic.toggle();
  };

  const handleNextTrack = () => {
    techMusic.nextTrack();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    techMusic.setVolume(val);
  };

  return (
    <div className="relative z-30">
      <div className="flex items-center gap-2 bg-[#120703]/90 border border-[#d4a017]/40 backdrop-blur-md rounded-2xl px-2.5 py-1.5 shadow-lg shadow-black/50">
        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow ${
            isPlaying
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-cyan-500/30'
              : 'bg-[#3b1709] hover:bg-[#5a240e] text-[#ffd700] border border-[#d4a017]/50'
          }`}
          title={isPlaying ? 'Mettre en pause la musique Tech' : 'Lancer la musique Tech synchronisée'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        {/* Track Info & Visualizer */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer text-left hover:opacity-90 transition-opacity"
        >
          {/* Animated Neon Equalizer Bars */}
          <div className="flex items-end gap-0.5 h-4 w-4 shrink-0">
            {[1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className={`w-0.5 rounded-full transition-all duration-150 ${
                  isPlaying
                    ? isDucked
                      ? 'bg-amber-400 opacity-60 h-2'
                      : 'bg-cyan-400 animate-pulse'
                    : 'bg-stone-600 h-1'
                }`}
                style={{
                  height: isPlaying ? (isDucked ? '30%' : `${30 + ((bar * 23) % 70)}%`) : '20%',
                }}
              />
            ))}
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-cyan-300 tracking-wider truncate max-w-[130px] sm:max-w-[160px]">
                {track.name}
              </span>
              <span className="text-[9px] px-1 py-0.2 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded font-mono">
                {track.bpm} BPM
              </span>
              {isDucked && (
                <span className="text-[8px] px-1 bg-amber-500/20 border border-amber-400/50 text-amber-300 rounded font-bold animate-pulse">
                  Voix IA Active
                </span>
              )}
            </div>
            <div className="text-[9px] text-stone-400 truncate max-w-[150px]">
              {track.subtitle}
            </div>
          </div>
        </button>

        {/* Next Track Button */}
        <button
          onClick={handleNextTrack}
          className="p-1 text-stone-400 hover:text-cyan-300 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Changer de piste Tech (nouvelle à chaque connexion)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Volume Mute Toggle */}
        <button
          onClick={() => techMusic.toggleMute()}
          className="p-1 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Control Drawer */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#140602]/95 border border-cyan-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2.5 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Musique Tech Synchronisée</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-stone-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="text-[11px] text-stone-300 space-y-1">
            <div className="font-semibold text-white">{track.name}</div>
            <div className="text-[10px] text-stone-400">{track.subtitle}</div>
            <div className="flex items-center gap-2 text-[10px] text-cyan-300/90 pt-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Générée à chaque connexion & ducking voix IA actif</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-black/60 rounded-lg"
            />
          </div>

          {/* Next Track Switcher */}
          <button
            onClick={handleNextTrack}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-[#2a1309] to-[#3f1c0d] hover:border-cyan-400 border border-[#d4a017]/40 rounded-xl font-bold text-amber-200 text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <SkipForward className="w-3 h-3 text-cyan-300" />
            <span>Piste Tech Suivante</span>
          </button>
        </div>
      )}
    </div>
  );
};
