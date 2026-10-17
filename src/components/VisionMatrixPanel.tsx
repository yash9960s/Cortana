import React, { useState, useRef } from 'react';
import { Upload, Scan, FileText, CheckCircle2, AlertCircle, Copy, Volume2, Sparkles } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface VisionMatrixPanelProps {
  onAnalyze: (fileData: string, mimeType: string, fileName: string, analysisType: string) => Promise<string>;
  onVocalize: (text: string) => void;
  isScanning: boolean;
}

export const VisionMatrixPanel: React.FC<VisionMatrixPanelProps> = ({
  onAnalyze,
  onVocalize,
  isScanning,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>('image/png');
  const [fileName, setFileName] = useState<string>('');
  const [analysisType, setAnalysisType] = useState<string>('comprehensive');
  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-baked futuristic sample data for instant exploration
  const loadSample = (type: 'schematic' | 'neural' | 'security') => {
    soundFx.playChirp(1250);
    if (type === 'neural') {
      setFileName('UNSC_Neural_Matrix_v4.png');
      setFileMime('image/svg+xml');
      // Create SVG diagram of AI neural core as data URL
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="#050811">
        <rect width="600" height="400" fill="#050811"/>
        <circle cx="300" cy="200" r="120" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="8,4"/>
        <circle cx="300" cy="200" r="70" fill="none" stroke="#3b82f6" stroke-width="3"/>
        <circle cx="300" cy="200" r="25" fill="#06b6d4" opacity="0.6"/>
        <line x1="300" y1="80" x2="300" y2="40" stroke="#06b6d4" stroke-width="2"/>
        <line x1="300" y1="320" x2="300" y2="360" stroke="#06b6d4" stroke-width="2"/>
        <line x1="180" y1="200" x2="130" y2="200" stroke="#06b6d4" stroke-width="2"/>
        <line x1="420" y1="200" x2="470" y2="200" stroke="#06b6d4" stroke-width="2"/>
        <text x="300" y="205" fill="#ffffff" font-family="monospace" font-size="12" text-anchor="middle">NEURAL NUCLEUS</text>
        <text x="300" y="30" fill="#06b6d4" font-family="monospace" font-size="14" text-anchor="middle">SUB-TIER SYNAPSE 04-B</text>
        <text x="300" y="385" fill="#38bdf8" font-family="monospace" font-size="11" text-anchor="middle">THROUGHPUT: 4.88 TFLOPS // STATUS: NOMINAL</text>
      </svg>`;
      const base64 = btoa(svg);
      setSelectedImage(`data:image/svg+xml;base64,${base64}`);
    } else if (type === 'schematic') {
      setFileName('Quantum_Telemetry_Array.png');
      setFileMime('image/svg+xml');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="#070b19">
        <rect width="600" height="400" fill="#070b19"/>
        <polygon points="150,100 450,100 500,250 100,250" fill="none" stroke="#22d3ee" stroke-width="2"/>
        <line x1="100" y1="250" x2="300" y2="350" stroke="#3b82f6" stroke-width="2"/>
        <line x1="500" y1="250" x2="300" y2="350" stroke="#3b82f6" stroke-width="2"/>
        <circle cx="300" cy="180" r="40" fill="none" stroke="#06b6d4" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="300" y="185" fill="#a5f3fc" font-family="monospace" font-size="12" text-anchor="middle">CORE DISPERSION</text>
        <text x="300" y="70" fill="#38bdf8" font-family="monospace" font-size="14" text-anchor="middle">SUPERCONDUCTING FLUX BUS</text>
      </svg>`;
      const base64 = btoa(svg);
      setSelectedImage(`data:image/svg+xml;base64,${base64}`);
    } else {
      setFileName('Security_Cluster_Topology.png');
      setFileMime('image/svg+xml');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="#050811">
        <rect width="600" height="400" fill="#050811"/>
        <rect x="80" y="80" width="120" height="80" rx="8" fill="none" stroke="#f43f5e" stroke-width="2"/>
        <text x="140" y="125" fill="#f43f5e" font-family="monospace" font-size="11" text-anchor="middle">FIREWALL NODE</text>
        <rect x="400" y="80" width="120" height="80" rx="8" fill="none" stroke="#10b981" stroke-width="2"/>
        <text x="460" y="125" fill="#10b981" font-family="monospace" font-size="11" text-anchor="middle">AUTH GATEWAY</text>
        <rect x="240" y="240" width="120" height="80" rx="8" fill="none" stroke="#06b6d4" stroke-width="2"/>
        <text x="300" y="285" fill="#06b6d4" font-family="monospace" font-size="11" text-anchor="middle">DATA VAULT</text>
        <line x1="200" y1="120" x2="400" y2="120" stroke="#64748b" stroke-width="2" stroke-dasharray="4,4"/>
        <line x1="140" y1="160" x2="240" y2="280" stroke="#f43f5e" stroke-width="2"/>
        <line x1="460" y1="160" x2="360" y2="280" stroke="#10b981" stroke-width="2"/>
      </svg>`;
      const base64 = btoa(svg);
      setSelectedImage(`data:image/svg+xml;base64,${base64}`);
    }
    setReport(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playChirp(1200);
    setFileName(file.name);
    setFileMime(file.type || 'image/png');
    setReport(null);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const executeAnalysis = async () => {
    if (!selectedImage) return;

    soundFx.playScanPing();
    const base64Data = selectedImage.split(',')[1] || selectedImage;

    try {
      const result = await onAnalyze(base64Data, fileMime, fileName || 'optical_target.png', analysisType);
      setReport(result);
      soundFx.playChirp(1600, 0.1);
    } catch (e: any) {
      console.error('Analysis error:', e);
    }
  };

  const copyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    soundFx.playChirp(1500, 0.04);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full sci-panel rounded-xl overflow-hidden p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
        <div>
          <h2 className="font-hud text-lg md:text-xl font-bold text-cyan-300 flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            Holographic Vision & Matrix Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gemini multimodal optical sensor. Scan schematics, architectural blueprints, UI frames, and documents.
          </p>
        </div>

        {/* Preset Samples */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">PRESETS:</span>
          <button
            onClick={() => loadSample('neural')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
          >
            Neural Core
          </button>
          <button
            onClick={() => loadSample('schematic')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
          >
            Quantum Bus
          </button>
          <button
            onClick={() => loadSample('security')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
          >
            Security Mesh
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Scanner Stage + Analysis Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Visual Target & Laser Scanner (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.txt,.pdf,.json"
          />

          <div
            onClick={() => !selectedImage && fileInputRef.current?.click()}
            className={`relative flex-1 min-h-[260px] md:min-h-[340px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 overflow-hidden transition-all select-none ${
              selectedImage
                ? 'border-cyan-500/50 bg-slate-950/80'
                : 'border-cyan-500/30 bg-slate-950/40 hover:border-cyan-400/60 hover:bg-cyan-950/10 cursor-pointer'
            }`}
          >
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Optical Target"
                  className="max-h-[300px] max-w-full object-contain rounded-lg border border-cyan-500/30 shadow-2xl"
                  referrerPolicy="no-referrer"
                />

                {/* Laser Bar Animation during scanning */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div
                      className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#06b6d4] animate-pulse"
                      style={{
                        animation: 'holoScan 2.4s infinite linear',
                      }}
                    />
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-400">
                      SCANNING FREQ: 948 THz
                    </div>
                  </div>
                )}

                {/* Overlay telemetry pins */}
                <div className="absolute top-2 right-2 text-xs font-mono text-cyan-400 bg-slate-950/80 px-2 py-1 rounded border border-cyan-500/30">
                  {fileName || 'TARGET // LOADED'}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-hud text-sm font-semibold text-cyan-200">
                    Click to Upload Optical Target
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts PNG, JPG, WebP, SVG, diagrams, architecture schematics, or documents
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-xs font-hud text-cyan-300 transition-colors cursor-pointer"
            >
              Choose New Image
            </button>

            <button
              onClick={executeAnalysis}
              disabled={!selectedImage || isScanning}
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-hud font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/50"
            >
              <Scan className="w-4 h-4" />
              <span>{isScanning ? 'Executing Optical Scan...' : 'Initiate Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Parameters & Deconstructed Report (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Analysis Type Selector */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/20 space-y-2">
            <span className="text-xs font-hud font-semibold text-cyan-400 block">
              ANALYSIS VECTOR
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'comprehensive', label: 'Tactical Deconstruct' },
                { id: 'code_security', label: 'Security & Audit' },
                { id: 'schematic', label: 'Schematic Breakdown' },
                { id: 'data_summary', label: 'Core Intelligence' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    soundFx.playChirp(1100);
                    setAnalysisType(opt.id);
                  }}
                  className={`p-2 rounded text-left text-xs font-mono transition-colors cursor-pointer ${
                    analysisType === opt.id
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                      : 'bg-slate-900/60 text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Report Output Area */}
          <div className="flex-1 flex flex-col rounded-xl bg-slate-950/80 border border-cyan-500/25 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 text-xs font-mono text-cyan-300">
              <span className="font-hud font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                CORTANA INTELLIGENCE DOSSIER
              </span>
              {report && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onVocalize(report)}
                    className="hover:text-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Vocalize Report"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>Speak</span>
                  </button>
                  <button
                    onClick={copyReport}
                    className="hover:text-cyan-100 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy Report"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-cyan-50 leading-relaxed space-y-3">
              {report ? (
                <div className="whitespace-pre-wrap">{report}</div>
              ) : isScanning ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                  <p className="text-cyan-300">Optical tensors active. Deconstructing visual matrix...</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-8 space-y-1">
                  <AlertCircle className="w-6 h-6 text-slate-600 mb-1" />
                  <p>Target awaiting directive.</p>
                  <p className="text-[11px]">Select a vector and initiate optical analysis.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
