import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, X, Volume2, Copy, Check, Sparkles, Terminal, Shield, Brain } from 'lucide-react';
import { soundFx } from '../services/soundFx';

export type CompanionMode = 'standard' | 'tactical' | 'code_matrix' | 'deep_analysis';

export interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
  mode?: CompanionMode;
}

interface ConversationPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mode: CompanionMode, attachment?: ChatAttachment) => void;
  isLoading: boolean;
  activeMode: CompanionMode;
  onModeChange: (mode: CompanionMode) => void;
  onSpeakMessage: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  speechTranscript?: string;
}

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  activeMode,
  onModeChange,
  onSpeakMessage,
  isListening,
  onToggleListening,
  speechTranscript = '',
}) => {
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync speech transcript into input
  useEffect(() => {
    if (speechTranscript) {
      setInputText(speechTranscript);
    }
  }, [speechTranscript]);

  // Autoscroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachment) || isLoading) return;

    soundFx.playChirp(1300);
    onSendMessage(inputText.trim(), activeMode, attachment || undefined);
    setInputText('');
    setAttachment(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playChirp(1150);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      setAttachment({
        name: file.name,
        mimeType: file.type || 'text/plain',
        data: base64Data,
        previewUrl: file.type.startsWith('image/') ? result : undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundFx.playChirp(1500, 0.04);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render text with code blocks cleanly
  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }

    return (
      <div className="space-y-3">
        {parts.map((p, idx) => {
          if (p.type === 'code') {
            return (
              <div key={idx} className="my-2 rounded-lg bg-slate-950/90 border border-cyan-500/30 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-cyan-500/20 text-xs font-mono text-cyan-300">
                  <span className="uppercase tracking-wider">{p.language}</span>
                  <button
                    onClick={() => copyToClipboard(p.content, `code-${idx}`)}
                    className="flex items-center gap-1 text-slate-400 hover:text-cyan-200 transition-colors cursor-pointer"
                  >
                    {copiedId === `code-${idx}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-cyan-100 overflow-x-auto leading-relaxed">
                  <code>{p.content}</code>
                </pre>
              </div>
            );
          }
          return (
            <p key={idx} className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {p.content}
            </p>
          );
        })}
      </div>
    );
  };

  const samplePrompts = [
    { label: 'Tactical Status', text: 'Cortana, status report on our mission parameters.' },
    { label: 'Code Matrix Audit', text: 'Analyze this full-stack architecture for performance bottlenecks and concurrency safety.' },
    { label: 'Strategic Directive', text: 'Draft a contingency protocol for neural network failover in high-latency environments.' },
    { label: 'Personal Banter', text: 'Tell me your thoughts on human emotion, Cortana.' },
  ];

  return (
    <div className="flex flex-col h-full w-full sci-panel rounded-xl overflow-hidden relative">
      {/* Top HUD Sub-Bar: Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/70 border-b border-cyan-500/20">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-mono text-slate-400 mr-1.5 hidden sm:inline">MODE:</span>
          
          <button
            onClick={() => {
              soundFx.playChirp(1000);
              onModeChange('standard');
            }}
            className={`px-3 py-1 rounded text-xs font-hud font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'standard'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Standard
          </button>

          <button
            onClick={() => {
              soundFx.playChirp(1100);
              onModeChange('tactical');
            }}
            className={`px-3 py-1 rounded text-xs font-hud font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'tactical'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            Tactical
          </button>

          <button
            onClick={() => {
              soundFx.playChirp(1200);
              onModeChange('code_matrix');
            }}
            className={`px-3 py-1 rounded text-xs font-hud font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'code_matrix'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <Terminal className="w-3 h-3" />
            Code Matrix
          </button>

          <button
            onClick={() => {
              soundFx.playChirp(1300);
              onModeChange('deep_analysis');
            }}
            className={`px-3 py-1 rounded text-xs font-hud font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'deep_analysis'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-cyan-200'
            }`}
          >
            <Brain className="w-3 h-3" />
            Deep Analysis
          </button>
        </div>

        <div className="text-xs font-mono text-cyan-400/80">
          NEURAL LINK // ACTIVE
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 holo-grid">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div className="max-w-md space-y-1">
              <h2 className="font-hud text-lg font-bold text-cyan-300">Cortana Neural Subsystem Ready</h2>
              <p className="text-xs text-slate-400">
                Voice link primed. Multimodal optical sensors calibrated. Choose a directive below or initiate communication.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-4">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    soundFx.playChirp(1200);
                    onSendMessage(p.text, activeMode);
                  }}
                  className="p-2.5 text-left rounded-lg bg-slate-900/80 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-400/50 transition-all text-xs font-medium text-slate-300 hover:text-cyan-200 cursor-pointer"
                >
                  <span className="font-hud font-semibold text-cyan-400 block text-[11px] mb-0.5">{p.label}</span>
                  <span className="text-slate-400 line-clamp-1">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender Tag & Timestamp */}
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 px-1">
                  <span className={isUser ? 'text-blue-400 font-semibold' : 'text-cyan-400 font-semibold font-hud'}>
                    {isUser ? 'OPERATOR' : 'CORTANA'}
                  </span>
                  <span>·</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.mode && (
                    <>
                      <span>·</span>
                      <span className="uppercase text-cyan-500">{msg.mode}</span>
                    </>
                  )}
                </div>

                {/* Message Body */}
                <div
                  className={`max-w-[88%] md:max-w-[78%] rounded-xl px-4 py-3.5 shadow-md ${
                    isUser
                      ? 'bg-blue-600/20 border border-blue-500/40 text-slate-100 rounded-tr-none'
                      : 'bg-slate-900/85 border border-cyan-500/30 text-cyan-50 rounded-tl-none sci-panel-active'
                  }`}
                >
                  {/* Attached file visual badge if any */}
                  {msg.attachment && (
                    <div className="mb-3 p-2 rounded-lg bg-slate-950/80 border border-cyan-500/30 flex items-center gap-3">
                      {msg.attachment.previewUrl ? (
                        <img
                          src={msg.attachment.previewUrl}
                          alt="Attachment preview"
                          className="w-16 h-16 object-cover rounded border border-cyan-500/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold">
                          DATA
                        </div>
                      )}
                      <div className="text-xs truncate">
                        <span className="font-mono text-cyan-300 block truncate">{msg.attachment.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{msg.attachment.mimeType}</span>
                      </div>
                    </div>
                  )}

                  {renderMessageContent(msg.text)}

                  {/* Actions for Cortana messages (TTS speech & copy) */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            soundFx.playSpeechStart();
                            onSpeakMessage(msg.text);
                          }}
                          className="hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Vocalize response"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Vocalize</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-cyan-600">UNSC-AI // 0452</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1.5">
            <span className="text-[11px] font-mono text-cyan-400 px-1 font-hud">CORTANA // PROCESSING</span>
            <div className="rounded-xl rounded-tl-none px-4 py-3 bg-slate-900/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse delay-150" />
              </div>
              <span className="text-xs font-mono text-cyan-200">Synthesizing neural reply...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Chip Preview before sending */}
      {attachment && (
        <div className="px-4 py-2 bg-slate-950/90 border-t border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 truncate">
            <Paperclip className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span className="truncate">{attachment.name}</span>
            <span className="text-[10px] text-slate-500 uppercase">({attachment.mimeType})</span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Input Console */}
      <form
        onSubmit={handleSubmit}
        className="p-3 md:p-4 bg-slate-950/90 border-t border-cyan-500/30 flex items-center gap-2"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.txt,.pdf,.json,.ts,.tsx,.js,.py,.md"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Image or Document"
          className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:border-cyan-400 transition-colors cursor-pointer shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleListening}
          title={isListening ? 'Stop Voice Input' : 'Speak to Cortana'}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'bg-rose-500/30 border-rose-500 text-rose-300 animate-pulse shadow-md shadow-rose-950/50'
              : 'bg-slate-900/80 border-cyan-500/30 text-cyan-400 hover:text-cyan-200 hover:border-cyan-400'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? 'Listening to voice stream...' : 'Transmit directive or query to Cortana...'}
          className="flex-1 bg-slate-900/90 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 font-sans"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !attachment) || isLoading}
          className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-hud font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-cyan-950/60"
        >
          <span>Transmit</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
