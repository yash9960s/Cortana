import React, { useState } from 'react';
import { Shield, Code, Cpu, Activity, Play, Copy, CheckCircle2, Volume2, Sparkles } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface SmartToolsPanelProps {
  onExecuteTool: (toolId: string, input: string) => Promise<string>;
  onVocalize: (text: string) => void;
  isRunning: boolean;
}

export const SmartToolsPanel: React.FC<SmartToolsPanelProps> = ({
  onExecuteTool,
  onVocalize,
  isRunning,
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('tactical_assessment');
  const [inputText, setInputText] = useState<string>(
    'Deploying a mission-critical edge microservice with decentralized state synchronization across orbital satellites.'
  );
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const tools = [
    {
      id: 'tactical_assessment',
      name: 'Tactical Threat Matrix',
      icon: Shield,
      description: 'Evaluate strategic vulnerabilities, risk vectors, and contingencies.',
      defaultInput:
        'Deploying a mission-critical edge microservice with decentralized state synchronization across orbital satellites.',
    },
    {
      id: 'code_refactor',
      name: 'Neural Code Matrix',
      icon: Code,
      description: 'Perform architectural refactoring, asymptotic complexity audit, and clean design.',
      defaultInput: `// Optimize this concurrency queue for zero race conditions
async function processTaskQueue(tasks) {
  const results = [];
  for (const t of tasks) {
    results.push(await executeTask(t));
  }
  return results;
}`,
    },
    {
      id: 'quantum_digest',
      name: 'Quantum Knowledge Digest',
      icon: Cpu,
      description: 'Deconstruct and synthesize complex engineering, scientific, or philosophical topics.',
      defaultInput:
        'Quantum error correction using surface codes and topological braid states.',
    },
    {
      id: 'system_diagnostics',
      name: 'Holographic Diagnostics',
      icon: Activity,
      description: 'Run deep neural matrix health checks and system optimization subroutines.',
      defaultInput:
        'Run full neural sync diagnostic on Cortana cognitive core and evaluate synapse dispersion.',
    },
  ];

  const handleSelectTool = (tool: typeof tools[0]) => {
    soundFx.playChirp(1200);
    setSelectedTool(tool.id);
    setInputText(tool.defaultInput);
    setResult(null);
  };

  const handleRun = async () => {
    if (!inputText.trim() || isRunning) return;
    soundFx.playChirp(1400);

    try {
      const output = await onExecuteTool(selectedTool, inputText.trim());
      setResult(output);
      soundFx.playChirp(1600, 0.08);
    } catch (err) {
      console.error('Tool run failure:', err);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    soundFx.playChirp(1500, 0.04);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full sci-panel rounded-xl overflow-hidden p-4 md:p-6 space-y-6">
      {/* Banner */}
      <div className="pb-4 border-b border-cyan-500/20">
        <h2 className="font-hud text-lg md:text-xl font-bold text-cyan-300 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Cortana Tactical & Engineering Subsystems
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Specialized neural modules powered by Gemini for strategic analysis, code optimization, and quantum synthesis.
        </p>
      </div>

      {/* Tool Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tools.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleSelectTool(t)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-950/40 text-cyan-100'
                  : 'bg-slate-950/60 border-cyan-500/20 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="font-hud font-semibold text-xs tracking-wide">
                  {t.name}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed line-clamp-2 opacity-80">
                {t.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tool Input & Output Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Input Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <label className="text-xs font-mono text-cyan-300 font-semibold block">
            DIRECTIVE PARAMETERS // INPUT
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            placeholder="Specify problem statement, scenario constraints, or code snippet..."
            className="w-full flex-1 bg-slate-950/90 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none rounded-xl p-3.5 text-xs font-mono text-cyan-50 leading-relaxed resize-none"
          />

          <button
            onClick={handleRun}
            disabled={!inputText.trim() || isRunning}
            className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-hud font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/60"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRunning ? 'Synthesizing Subroutine...' : 'Execute Directive'}</span>
          </button>
        </div>

        {/* Right: Synthesis Dossier (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950/80 border border-cyan-500/25 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 text-xs font-mono text-cyan-300">
            <span className="font-hud font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              SYNTHESIS DOSSIER // OUTPUT
            </span>

            {result && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onVocalize(result)}
                  className="hover:text-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Vocalize Result"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vocalize</span>
                </button>
                <button
                  onClick={copyResult}
                  className="hover:text-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy Result"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-cyan-50 leading-relaxed">
            {result ? (
              <div className="whitespace-pre-wrap">{result}</div>
            ) : isRunning ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                <p className="text-cyan-300">Calculating optimal probability vectors...</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12 space-y-1">
                <p>Subroutine standing by.</p>
                <p className="text-[11px]">Configure directive input and execute.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
