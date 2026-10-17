import React from 'react';
import { Volume2, VolumeX, Mic, Activity } from 'lucide-react';
import { soundFx } from '../services/soundFx';

export type ActiveTab = 'dialogue' | 'vision' | 'tools' | 'telemetry';

interface HudHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  syncStatus: string;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  activeTab,
  onTabChange,
  isVoiceActive,
  onToggleVoice,
  audioEnabled,
  onToggleAudio,
  syncStatus,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/80 border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <span className="font-hud text-xl font-bold tracking-wider text-cyan-400 glow-text-cyan flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          CORTANA // AI COMPANION
        </span>
        <span className="hidden sm:inline-block text-xs font-mono text-cyan-500/70 border-l border-cyan-500/30 pl-3">
          {syncStatus}
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => {
            soundFx.playChirp(1000);
            onTabChange('dialogue');
          }}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer font-hud tracking-wide ${
            activeTab === 'dialogue'
              ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          Neural Dialogue
        </button>

        <button
          onClick={() => {
            soundFx.playChirp(1100);
            onTabChange('vision');
          }}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer font-hud tracking-wide ${
            activeTab === 'vision'
              ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          Vision & Matrix
        </button>

        <button
          onClick={() => {
            soundFx.playChirp(1200);
            onTabChange('tools');
          }}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer font-hud tracking-wide ${
            activeTab === 'tools'
              ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          Tactical Tools
        </button>

        <button
          onClick={() => {
            soundFx.playChirp(1300);
            onTabChange('telemetry');
          }}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer font-hud tracking-wide ${
            activeTab === 'telemetry'
              ? 'text-cyan-300 border-b-2 border-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-cyan-200'
          }`}
        >
          Core Telemetry
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? 'Mute Sci-Fi Audio FX' : 'Enable Sci-Fi Audio FX'}
          className="p-2 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:border-cyan-400 transition-colors cursor-pointer"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        <button
          onClick={onToggleVoice}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-hud font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
            isVoiceActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500 shadow-md shadow-rose-950/40 animate-pulse'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-400'
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isVoiceActive ? 'animate-bounce' : ''}`} />
          <span>{isVoiceActive ? 'Listening...' : 'Voice Link'}</span>
        </button>
      </div>
    </header>
  );
};
