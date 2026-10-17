import React, { useState, useEffect, useCallback } from 'react';
import { HolographicAvatar, AvatarState } from './components/HolographicAvatar';
import { HudHeader, ActiveTab } from './components/HudHeader';
import { ConversationPanel, ChatMessage, ChatAttachment, CompanionMode } from './components/ConversationPanel';
import { VisionMatrixPanel } from './components/VisionMatrixPanel';
import { SmartToolsPanel } from './components/SmartToolsPanel';
import { TelemetryDrawer } from './components/TelemetryDrawer';
import { StartupSequence } from './components/StartupSequence';
import { speechService } from './services/speechService';
import { soundFx } from './services/soundFx';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dialogue');
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<CompanionMode>('standard');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [soundVolume, setSoundVolume] = useState<number>(0.5);
  const [showStartup, setShowStartup] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string>('GEMINI-3.8 // 100%');

  // Long-term companion memory
  const [memoryItems, setMemoryItems] = useState([
    {
      id: 'mem-1',
      category: 'Directive',
      detail: 'Primary User identified as Chief / Commander. Prioritize mission success and strategic clarity.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'mem-2',
      category: 'Preference',
      detail: 'Tone Calibration: Warm, loyal, charismatic, and razor-sharp wit with deep scientific knowledge.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'mem-3',
      category: 'Mission',
      detail: 'Quantum code architecture and tactical systems engineering.',
      timestamp: new Date().toISOString(),
    },
  ]);

  // Initial message from Cortana
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'cortana-init',
      role: 'assistant',
      text: "Cortana online. All systems nominal, Chief. Neural link synchronized with Gemini.\n\nWhether you need tactical analysis, full-stack code architecture, optical intelligence, or quantum knowledge synthesis—I'm right here with you. What's our first directive?",
      timestamp: new Date().toISOString(),
      mode: 'standard',
    },
  ]);

  // Vocalize assistant speech using Gemini TTS and track audio levels for lip sync
  const vocalizeText = useCallback((text: string) => {
    setAvatarState('speaking');
    soundFx.playSpeechStart();

    speechService.speak(text, {
      voiceName: 'Kore',
      onAudioLevel: (lvl) => setAudioLevel(lvl),
      onStart: () => setAvatarState('speaking'),
      onEnd: () => {
        setAvatarState('idle');
        setAudioLevel(0);
      },
      onError: (err) => {
        console.warn('Speech playback notification:', err);
        setAvatarState('idle');
        setAudioLevel(0);
      },
    });
  }, []);

  // Send message to Gemini server endpoint
  const handleSendMessage = async (text: string, mode: CompanionMode, attachment?: ChatAttachment) => {
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      attachment,
      mode,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setAvatarState('thinking');
    setSyncStatus('PROCESSING // GEMINI-3.8');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            text: m.text,
            attachment: m.attachment,
          })),
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || 'Systems nominal, Chief.';

      const assistantMsg: ChatMessage = {
        id: 'cortana-' + Date.now(),
        role: 'assistant',
        text: reply,
        timestamp: new Date().toISOString(),
        mode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
      setSyncStatus('GEMINI-3.8 // 100%');

      // Automatically vocalize response if voice link is active or speech enabled
      vocalizeText(reply);
    } catch (error: any) {
      console.error('Chat error:', error);
      setIsLoading(false);
      setAvatarState('idle');
      setSyncStatus('FAULT // RECONNECTED');

      const errorMsg: ChatMessage = {
        id: 'cortana-err-' + Date.now(),
        role: 'assistant',
        text: `Neural communication interruption: ${error.message || 'Check GEMINI_API_KEY configuration'}. Standing by for retry.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Toggle voice recognition
  const handleToggleVoice = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setAvatarState('idle');
      soundFx.playChirp(800);
    } else {
      soundFx.playChirp(1200);
      setSpeechTranscript('');
      const started = speechService.startListening({
        onStart: () => {
          setIsListening(true);
          setAvatarState('listening');
        },
        onResult: (transcript, isFinal) => {
          setSpeechTranscript(transcript);
          if (isFinal && transcript.trim()) {
            speechService.stopListening();
            setIsListening(false);
            handleSendMessage(transcript.trim(), activeMode);
          }
        },
        onError: (err) => {
          console.warn('Voice recognition error:', err);
          setIsListening(false);
          setAvatarState('idle');
        },
        onEnd: () => {
          setIsListening(false);
          if (avatarState === 'listening') {
            setAvatarState('idle');
          }
        },
      });

      if (!started) {
        setIsListening(false);
      }
    }
  };

  // Analyze multimodal image/document via /api/analyze
  const handleVisionAnalyze = async (
    fileData: string,
    mimeType: string,
    fileName: string,
    analysisType: string
  ): Promise<string> => {
    setAvatarState('analyzing');
    setSyncStatus('OPTICAL SCAN // ACTIVE');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, mimeType, fileName, analysisType }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const data = await response.json();
      setAvatarState('idle');
      setSyncStatus('GEMINI-3.8 // 100%');
      return data.analysis || 'Analysis completed with zero critical anomalies.';
    } catch (e: any) {
      setAvatarState('idle');
      setSyncStatus('FAULT // OPTICAL SENSOR');
      throw e;
    }
  };

  // Execute tactical smart tool via /api/tools/execute
  const handleExecuteTool = async (toolId: string, input: string): Promise<string> => {
    setAvatarState('thinking');
    setSyncStatus('TOOL // SUBROUTINE');

    try {
      const response = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, input }),
      });

      if (!response.ok) {
        throw new Error(`Tool execution error: ${response.status}`);
      }

      const data = await response.json();
      setAvatarState('idle');
      setSyncStatus('GEMINI-3.8 // 100%');
      return data.result || 'Subroutine executed successfully.';
    } catch (e: any) {
      setAvatarState('idle');
      setSyncStatus('FAULT // SUBROUTINE');
      throw e;
    }
  };

  // Memory management
  const handleAddMemory = (category: string, detail: string) => {
    const newItem = {
      id: 'mem-' + Date.now(),
      category,
      detail,
      timestamp: new Date().toISOString(),
    };
    setMemoryItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    soundFx.playChirp(900);
    setMemoryItems((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAllMemory = () => {
    soundFx.playGlitch();
    setMemoryItems([]);
  };

  const handleToggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    soundFx.enabled = nextState;
    if (nextState) {
      soundFx.playChirp(1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cinematic Startup Sequence Modal */}
      {showStartup && (
        <StartupSequence onComplete={() => setShowStartup(false)} />
      )}

      {/* Top HUD Bar */}
      <HudHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isVoiceActive={isListening}
        onToggleVoice={handleToggleVoice}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        syncStatus={syncStatus}
      />

      {/* Main HUD Viewport: 1440px wide baseline */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Holographic Avatar Console Stage (5 cols on lg) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          <div className="sci-panel rounded-xl p-4 md:p-6 flex flex-col items-center justify-between relative overflow-hidden min-h-[440px] lg:min-h-[580px]">
            {/* Holographic Projection Header */}
            <div className="w-full flex items-center justify-between text-xs font-mono text-cyan-400 pb-2 border-b border-cyan-500/20">
              <span className="font-hud font-semibold tracking-wider">
                UNSC HOLO-EMITTER // 0452
              </span>
              <span className="text-slate-400">FPS: 60 · 24-BIT CYAN</span>
            </div>

            {/* The Animated Holographic Avatar */}
            <div className="flex-1 w-full flex items-center justify-center my-2">
              <HolographicAvatar
                state={avatarState}
                audioLevel={audioLevel}
                onGlitchTrigger={() => soundFx.playGlitch()}
                className="w-full h-full min-h-[320px]"
              />
            </div>

            {/* Quick Companion Status Telemetry Footer */}
            <div className="w-full pt-3 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-hud">CORTANA AI</span>
              </div>
              <span>COGNITION: ACTIVE</span>
            </div>
          </div>

          {/* Quick HUD Directive Strip */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                soundFx.playChirp(1200);
                setActiveTab('vision');
              }}
              className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/25 hover:border-cyan-400/60 hover:bg-cyan-950/20 transition-all text-left cursor-pointer flex flex-col justify-between"
            >
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                OPTICAL SCAN
              </span>
              <span className="text-xs font-hud font-semibold text-slate-200 mt-1">
                Deconstruct Artifact
              </span>
            </button>

            <button
              onClick={() => {
                soundFx.playChirp(1300);
                setActiveTab('tools');
              }}
              className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/25 hover:border-cyan-400/60 hover:bg-cyan-950/20 transition-all text-left cursor-pointer flex flex-col justify-between"
            >
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                TACTICAL MATRIX
              </span>
              <span className="text-xs font-hud font-semibold text-slate-200 mt-1">
                Execute Directives
              </span>
            </button>
          </div>
        </section>

        {/* Right Column: Active Interactive Workspace (7 cols on lg) */}
        <section className="lg:col-span-7 flex flex-col min-h-[580px]">
          {activeTab === 'dialogue' && (
            <ConversationPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeMode={activeMode}
              onModeChange={setActiveMode}
              onSpeakMessage={vocalizeText}
              isListening={isListening}
              onToggleListening={handleToggleVoice}
              speechTranscript={speechTranscript}
            />
          )}

          {activeTab === 'vision' && (
            <VisionMatrixPanel
              onAnalyze={handleVisionAnalyze}
              onVocalize={vocalizeText}
              isScanning={avatarState === 'analyzing'}
            />
          )}

          {activeTab === 'tools' && (
            <SmartToolsPanel
              onExecuteTool={handleExecuteTool}
              onVocalize={vocalizeText}
              isRunning={avatarState === 'thinking'}
            />
          )}

          {activeTab === 'telemetry' && (
            <TelemetryDrawer
              memoryItems={memoryItems}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
              onClearAllMemory={handleClearAllMemory}
              soundVolume={soundVolume}
              onVolumeChange={setSoundVolume}
              onTriggerBootSequence={() => setShowStartup(true)}
            />
          )}
        </section>
      </main>

      {/* Futuristic Bottom Status Ribbon */}
      <footer className="w-full border-t border-cyan-500/20 bg-slate-950/90 py-2.5 px-6 flex items-center justify-between text-[11px] font-mono text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold font-hud">
            CORTANA AI
          </span>
          <span>·</span>
          <span>NEURAL COMPANION INTERFACE</span>
          <span>·</span>
          <span>POWERED BY GOOGLE GEMINI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cyan-500/70">QUANTUM LINK: SECURE</span>
          <span className="text-slate-400">v4.8-UNSC</span>
        </div>
      </footer>
    </div>
  );
}
