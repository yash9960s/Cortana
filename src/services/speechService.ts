/**
 * Speech Recognition and Gemini TTS Service
 * Provides natural voice input and server-side speech synthesis with real-time audio analysis
 */

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class SpeechService {
  private recognition: any = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  public isListening: boolean = false;
  public isSpeaking: boolean = false;
  public currentLevel: number = 0;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  public isSpeechSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(handlers: SpeechRecognitionHandlers): boolean {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        handlers.onError?.('Speech recognition is not supported in this browser environment.');
        return false;
      }
    }

    try {
      this.recognition.onstart = () => {
        this.isListening = true;
        handlers.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        handlers.onResult?.(text, !!finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        console.warn('Speech recognition error:', event.error);
        handlers.onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        handlers.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      handlers.onError?.(e.message || 'Microphone activation error.');
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  /**
   * Synthesizes and plays speech using Gemini TTS (with fallback to Web Speech)
   * Connects to Web Audio AnalyserNode to emit live audio frequency/amplitude for avatar lip sync
   */
  public async speak(
    text: string,
    options?: {
      voiceName?: string;
      onAudioLevel?: (level: number) => void;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: string) => void;
    }
  ): Promise<void> {
    this.stopSpeaking();
    this.isSpeaking = true;
    options?.onStart?.();

    try {
      // 1. Try Gemini 3.8 Flash Lite TTS endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName: options?.voiceName || 'Kore',
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS server responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.audio) {
        throw new Error('TTS payload had no audio content');
      }

      const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audio}`;
      const audio = new Audio(audioSrc);
      this.currentAudio = audio;

      // Setup audio analyzer for lipsync / avatar reactive glow
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        const source = this.audioCtx.createMediaElementSource(audio);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!this.isSpeaking || !this.analyser) {
            this.currentLevel = 0;
            options?.onAudioLevel?.(0);
            return;
          }

          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const normalized = Math.min(1, avg / 80);
          this.currentLevel = normalized;
          options?.onAudioLevel?.(normalized);

          this.animFrameId = requestAnimationFrame(updateLevel);
        };

        this.animFrameId = requestAnimationFrame(updateLevel);
      }

      audio.onended = () => {
        this.cleanUpPlayback();
        options?.onEnd?.();
      };

      audio.onerror = (e) => {
        console.warn('Audio element error, falling back to Web Speech:', e);
        this.cleanUpPlayback();
        this.fallbackWebSpeech(text, options);
      };

      await audio.play();
    } catch (err: any) {
      console.warn('Gemini TTS failed or unavailable, fallback to Web Speech API:', err.message);
      this.fallbackWebSpeech(text, options);
    }
  }

  private fallbackWebSpeech(
    text: string,
    options?: {
      onAudioLevel?: (level: number) => void;
      onEnd?: () => void;
      onError?: (err: string) => void;
    }
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.isSpeaking = false;
      options?.onError?.('Speech synthesis unavailable');
      options?.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.slice(0, 500).replace(/```[\s\S]*?```/g, 'Code block generated.');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick a natural female English voice if available
    const voices = window.speechSynthesis.getVoices();
    const cortanaVoice = voices.find(
      (v) =>
        (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Victoria') || v.name.includes('Google UK English Female')) &&
        v.lang.startsWith('en')
    );
    if (cortanaVoice) {
      utterance.voice = cortanaVoice;
    }

    utterance.pitch = 1.05;
    utterance.rate = 1.0;

    // Simulate animated lip-sync levels while browser is speaking
    let interval: any = null;
    interval = setInterval(() => {
      if (!this.isSpeaking) {
        clearInterval(interval);
        return;
      }
      const simLevel = 0.3 + Math.random() * 0.6;
      this.currentLevel = simLevel;
      options?.onAudioLevel?.(simLevel);
    }, 90);

    utterance.onend = () => {
      clearInterval(interval);
      this.cleanUpPlayback();
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      clearInterval(interval);
      this.cleanUpPlayback();
      options?.onError?.(e.error);
      options?.onEnd?.();
    };

    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    this.cleanUpPlayback();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  private cleanUpPlayback() {
    this.isSpeaking = false;
    this.currentLevel = 0;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }
    this.analyser = null;
  }
}

export const speechService = new SpeechService();
