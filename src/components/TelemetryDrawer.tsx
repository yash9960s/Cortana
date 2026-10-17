import React, { useState } from 'react';
import { Activity, Cpu, Sliders, Trash2, Plus, Volume2, ShieldCheck, Zap } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface MemoryItem {
  id: string;
  category: string;
  detail: string;
  timestamp: string;
}

interface TelemetryDrawerProps {
  memoryItems: MemoryItem[];
  onAddMemory: (category: string, detail: string) => void;
  onDeleteMemory: (id: string) => void;
  onClearAllMemory: () => void;
  soundVolume: number;
  onVolumeChange: (vol: number) => void;
  onTriggerBootSequence: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({
  memoryItems,
  onAddMemory,
  onDeleteMemory,
  onClearAllMemory,
  soundVolume,
  onVolumeChange,
  onTriggerBootSequence,
}) => {
  const [newCat, setNewCat] = useState('Directive');
  const [newDetail, setNewDetail] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetail.trim()) return;
    soundFx.playChirp(1300);
    onAddMemory(newCat, newDetail.trim());
    setNewDetail('');
  };

  return (
    <div className="flex flex-col h-full w-full sci-panel rounded-xl overflow-hidden p-4 md:p-6 space-y-6">
      {/* Banner */}
      <div className="pb-4 border-b border-cyan-500/20 flex items-center justify-between">
        <div>
          <h2 className="font-hud text-lg md:text-xl font-bold text-cyan-300 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Core Telemetry & Long-Term Memory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            UNSC-AI Architecture diagnostics, neural memory consolidation, and audio-visual projector parameters.
          </p>
        </div>

        <button
          onClick={() => {
            soundFx.playActivationChime();
            onTriggerBootSequence();
          }}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 hover:bg-cyan-500/30 text-cyan-300 text-xs font-hud font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Replay Boot Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Diagnostics & Hardware Telemetry (6 cols) */}
        <div className="lg:col-span-6 space-y-5 overflow-y-auto">
          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/25">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                SYNAPTIC INTEGRITY
              </span>
              <span className="text-xl font-hud font-bold text-cyan-300 tabular-nums">
                99.984%
              </span>
              <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                ● STABLE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/25">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                ACTIVE AI MODEL
              </span>
              <span className="text-sm font-hud font-bold text-cyan-200 block truncate">
                gemini-3.8-flash
              </span>
              <span className="text-[10px] font-mono text-cyan-400 block mt-1">
                SERVER NEURAL CORE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/25">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                VOICE SYNTHESIZER
              </span>
              <span className="text-sm font-hud font-bold text-cyan-200 block">
                Kore (Gemini TTS)
              </span>
              <span className="text-[10px] font-mono text-cyan-400 block mt-1">
                24kHz L16 PCM
              </span>
            </div>
          </div>

          {/* Projector & Audio Controls */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-4">
            <div className="flex items-center gap-2 font-hud text-xs font-semibold text-cyan-400">
              <Sliders className="w-4 h-4" />
              <span>HOLOGRAPHIC & AUDIO TUNING</span>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sci-Fi Synthesizer Volume</span>
                  </span>
                  <span className="text-cyan-300 tabular-nums">{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    soundFx.volume = val;
                    onVolumeChange(val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between text-slate-400 border-t border-cyan-500/15">
                <span>3D Parallax Gyroscope</span>
                <span className="text-cyan-300">Enabled (Interactive Mouse Tilt)</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Quantum Data Encryption</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> UNSC SHA-512
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Long-Term Memory Core (6 cols) */}
        <div className="lg:col-span-6 flex flex-col rounded-xl bg-slate-950/80 border border-cyan-500/25 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 text-xs font-mono text-cyan-300">
            <span className="font-hud font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              SYNAPSE MEMORY VAULT ({memoryItems.length})
            </span>

            {memoryItems.length > 0 && (
              <button
                onClick={onClearAllMemory}
                className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Purge Vault</span>
              </button>
            )}
          </div>

          {/* Memory List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
            {memoryItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-slate-900/60 border border-cyan-500/20 flex items-start justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {item.detail}
                  </p>
                </div>

                <button
                  onClick={() => onDeleteMemory(item.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  title="Delete memory unit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Memory Form */}
          <form
            onSubmit={handleAdd}
            className="p-3 bg-slate-950 border-t border-cyan-500/20 flex items-center gap-2"
          >
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="bg-slate-900 border border-cyan-500/30 text-xs font-mono text-cyan-300 rounded-lg px-2.5 py-2 focus:outline-none"
            >
              <option value="Directive">Directive</option>
              <option value="Preference">Preference</option>
              <option value="Mission">Mission</option>
              <option value="Fact">Fact</option>
            </select>

            <input
              type="text"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              placeholder="Record permanent directive or fact into Cortana's memory..."
              className="flex-1 bg-slate-900 border border-cyan-500/30 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!newDetail.trim()}
              className="p-2 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
