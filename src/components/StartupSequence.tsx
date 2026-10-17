import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, Shield, Zap } from 'lucide-react';
import { soundFx } from '../services/soundFx';

interface StartupSequenceProps {
  onComplete: () => void;
}

export const StartupSequence: React.FC<StartupSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    soundFx.playActivationChime();

    const timer1 = setTimeout(() => {
      soundFx.playChirp(800, 0.05);
      setStep(1);
    }, 900);

    const timer2 = setTimeout(() => {
      soundFx.playChirp(1200, 0.06);
      setStep(2);
    }, 2000);

    const timer3 = setTimeout(() => {
      soundFx.playChirp(1600, 0.1);
      setStep(3);
    }, 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleFinish = () => {
    soundFx.playChirp(1800, 0.12);
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#050811] flex flex-col items-center justify-center p-6 holo-grid select-none"
      >
        {/* Holographic Beam Center Glow */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg w-full text-center space-y-6">
          {/* Animated Holographic Rings */}
          <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/40 border-t-cyan-300 animate-spin" />
            <div
              className="absolute inset-3 rounded-full border border-blue-500/50 border-b-cyan-400"
              style={{ animation: 'radarCounterRotate 3s infinite linear' }}
            />
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-[0_0_25px_#06b6d4]">
              <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
            </div>
          </div>

          {/* Stepper Status Progression */}
          <div className="space-y-2">
            <h1 className="font-hud text-2xl md:text-3xl font-bold tracking-wider text-cyan-300 glow-text-cyan uppercase">
              CORTANA // AI COMPANION
            </h1>
            <p className="text-xs font-mono text-cyan-500 tracking-widest uppercase">
              UNSC NEURAL CORE INITIALIZATION
            </p>
          </div>

          {/* Boot Log Readout */}
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-4 text-left font-mono text-xs space-y-1.5 shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>[0.12s] Holographic Projector Pedestal: ONLINE</span>
            </div>
            {step >= 1 && (
              <div className="flex items-center gap-2 text-cyan-300 animate-fadeIn">
                <Terminal className="w-3.5 h-3.5 text-cyan-300" />
                <span>[1.44s] Gemini Neural Tensor Synapse: SYNCHRONIZED</span>
              </div>
            )}
            {step >= 2 && (
              <div className="flex items-center gap-2 text-cyan-200 animate-fadeIn">
                <Shield className="w-3.5 h-3.5 text-cyan-200" />
                <span>[2.80s] Voice Matrix & Optical Sensor Array: PRIMED</span>
              </div>
            )}
            {step >= 3 && (
              <div className="pt-2 text-cyan-100 font-semibold border-t border-cyan-500/20 animate-fadeIn">
                &ldquo;All systems nominal, Chief. Awaiting your directive.&rdquo;
              </div>
            )}
          </div>

          {/* Interactive Button to Enter */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={handleFinish}
              className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-hud font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:shadow-[0_0_35px_rgba(6,182,212,0.85)] cursor-pointer"
            >
              Initiate Neural Link
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
