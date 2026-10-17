import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { soundFx } from '../services/soundFx';

export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'analyzing';

interface HolographicAvatarProps {
  state: AvatarState;
  audioLevel?: number; // 0 to 1
  onGlitchTrigger?: () => void;
  className?: string;
}

export const HolographicAvatar: React.FC<HolographicAvatarProps> = ({
  state,
  audioLevel = 0,
  onGlitchTrigger,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parallax 3D tilt tracking
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isGlitching, setIsGlitching] = useState(false);
  const [blinkState, setBlinkState] = useState(false);

  // Natural blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 140);
    }, 3800 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  // Mouse move for 3D holographic parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    setTilt({
      x: (mouseY / (rect.height / 2)) * -14,
      y: (mouseX / (rect.width / 2)) * 14,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const triggerManualGlitch = () => {
    setIsGlitching(true);
    soundFx.playGlitch();
    onGlitchTrigger?.();
    setTimeout(() => setIsGlitching(false), 450);
  };

  // Canvas particle and HUD ring animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Generate floating holographic particles
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * 500,
      y: Math.random() * 500,
      size: Math.random() * 2.2 + 0.6,
      speedY: Math.random() * 0.9 + 0.4,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.05 + 0.02,
    }));

    // Data matrix stream glyphs
    const glyphs = '01010101CORTANASYNC4799HEXUNSC9800'.split('');

    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing holographic floor pedestal rings
      ctx.save();
      const pedestalY = height * 0.88;
      const pedestalRadiusX = width * 0.38;
      const pedestalRadiusY = height * 0.08;

      ctx.beginPath();
      ctx.ellipse(cx, pedestalY, pedestalRadiusX, pedestalRadiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = state === 'speaking' ? 'rgba(6, 182, 212, 0.7)' : 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Inner pedestal emitter disc
      ctx.beginPath();
      ctx.ellipse(cx, pedestalY, pedestalRadiusX * 0.65, pedestalRadiusY * 0.65, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 2. Draw rotating cybernetic HUD rings around the avatar
      const ringRotationSpeed = state === 'thinking' ? time * 1.8 : time * 0.4;
      const ringRadius = width * 0.38;

      // Outer Ring with notch ticks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringRotationSpeed);

      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12, 2, 12]);
      ctx.stroke();

      // Notches at cardinal points
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI * 2) / 16;
        const tickLen = i % 4 === 0 ? 12 : 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * (ringRadius - tickLen), Math.sin(angle) * (ringRadius - tickLen));
        ctx.lineTo(Math.cos(angle) * (ringRadius + tickLen), Math.sin(angle) * (ringRadius + tickLen));
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(6, 182, 212, 0.8)' : 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = i % 4 === 0 ? 2 : 1;
        ctx.stroke();
      }
      ctx.restore();

      // Middle Counter-rotating HUD Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-ringRotationSpeed * 0.7);

      ctx.beginPath();
      ctx.arc(0, 0, ringRadius * 0.82, 0, Math.PI * 2);
      ctx.strokeStyle = state === 'listening' ? 'rgba(6, 182, 212, 0.65)' : 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([35, 15, 5, 15]);
      ctx.stroke();

      // If listening or speaking, add audio reactive ring wave
      if (state === 'speaking' || state === 'listening') {
        const reactiveR = ringRadius * (0.85 + audioLevel * 0.18);
        ctx.beginPath();
        ctx.arc(0, 0, reactiveR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 + audioLevel * 0.5})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12 * audioLevel;
        ctx.stroke();
      }
      ctx.restore();

      // 3. Render Floating Holographic Particles (rising from projector)
      particles.forEach((p, idx) => {
        p.y -= p.speedY * (state === 'thinking' ? 2 : 1);
        p.x += p.speedX;

        // Reset particle if out of top or bounds
        if (p.y < 40) {
          p.y = pedestalY - 10;
          p.x = cx + (Math.random() - 0.5) * (pedestalRadiusX * 1.4);
        }

        const alpha = Math.sin(time + idx) * 0.3 + p.opacity;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.max(0, alpha)})`;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      });

      // 4. Data Matrix stream during "Thinking" state
      if (state === 'thinking') {
        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
        for (let col = 0; col < 6; col++) {
          const x = 50 + col * 75;
          const yOffset = (time * 60 + col * 40) % height;
          for (let row = 0; row < 8; row++) {
            const char = glyphs[(col * 4 + row) % glyphs.length];
            ctx.fillText(char, x, (yOffset + row * 16) % height);
          }
        }
        ctx.restore();
      }

      // 5. Scanning laser bar during "Analyzing" state
      if (state === 'analyzing') {
        const scanY = (Math.sin(time * 2) * 0.5 + 0.5) * height * 0.7 + height * 0.15;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - ringRadius, scanY);
        ctx.lineTo(cx + ringRadius, scanY);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 14;
        ctx.stroke();

        // Scan reticle coordinates
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#06b6d4';
        ctx.fillText(`SCAN // Y:${Math.round(scanY)} AZ:048.2`, cx + ringRadius - 100, scanY - 6);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, audioLevel]);

  // Dynamic avatar core glow based on state & audio level
  const coreGlow =
    state === 'speaking'
      ? `drop-shadow(0 0 ${18 + audioLevel * 24}px rgba(6, 182, 212, ${0.75 + audioLevel * 0.25}))`
      : state === 'listening'
      ? 'drop-shadow(0 0 22px rgba(6, 182, 212, 0.75))'
      : state === 'thinking'
      ? 'drop-shadow(0 0 26px rgba(59, 130, 246, 0.8))'
      : 'drop-shadow(0 0 14px rgba(6, 182, 212, 0.45))';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ perspective: 1000 }}
    >
      {/* Background canvas for rotating rings, particles, and scanner */}
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Holographic Projector Light Cone from bottom */}
      <div
        className="absolute bottom-6 w-72 h-80 bg-gradient-to-t from-cyan-500/20 via-cyan-500/5 to-transparent pointer-events-none z-0 blur-xl"
        style={{ clipPath: 'polygon(25% 100%, 75% 100%, 100% 0%, 0% 0%)' }}
      />

      {/* 3D Parallax Tilt Container */}
      <motion.div
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          scale: state === 'speaking' ? 1.02 : 1.0,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 25 }}
        className="relative z-10 w-[300px] h-[340px] md:w-[340px] md:h-[380px] flex items-center justify-center"
        style={{
          filter: isGlitching ? 'hue-rotate(90deg) contrast(180%)' : coreGlow,
        }}
      >
        {/* Holographic AI Avatar Silhouette & Cybernetic Facial Wireframe */}
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Subtle Glitch Offset Ghost layers */}
          {isGlitching && (
            <div className="absolute inset-0 opacity-40 translate-x-1.5 -translate-y-1 mix-blend-screen pointer-events-none text-cyan-300">
              <svg viewBox="0 0 200 240" className="w-full h-full">
                <circle cx="100" cy="110" r="50" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          )}

          {/* High-Fidelity Hologram Avatar SVG (Cortana Female AI Bust & Cyber Face) */}
          <svg
            viewBox="0 0 220 260"
            className="w-full h-full transition-transform duration-300"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))',
            }}
          >
            <defs>
              {/* Holographic Cyan Gradient */}
              <linearGradient id="holoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.4" />
              </linearGradient>

              {/* Skin Circuit Glow */}
              <linearGradient id="circuitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
              </linearGradient>

              {/* Glowing Hair Strands Gradient */}
              <linearGradient id="hairGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Hologram Aura / Head Silhouette Backing */}
            <path
              d="M110 32 C78 32, 60 55, 60 92 C60 120, 68 142, 85 160 C92 168, 98 178, 100 192 L100 220 L120 220 L120 192 C122 178, 128 168, 135 160 C152 142, 160 120, 160 92 C160 55, 142 32, 110 32 Z"
              fill="rgba(6, 182, 212, 0.08)"
              stroke="rgba(6, 182, 212, 0.35)"
              strokeWidth="1.2"
            />

            {/* Neck and Shoulder Contours (UNSC Ethereal Holographic Avatar Bust) */}
            <path
              d="M96 195 C75 204, 45 220, 25 245 L195 245 C175 220, 145 204, 124 195 Z"
              fill="rgba(6, 182, 212, 0.12)"
              stroke="rgba(6, 182, 212, 0.45)"
              strokeWidth="1.4"
            />

            {/* Shoulder Collarbone Hologram Circuit Lines */}
            <path
              d="M48 238 L86 218 L100 225 M172 238 L134 218 L120 225"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.2"
              strokeDasharray="4, 3"
            />

            {/* Sleek Cortana Signature Digital Bob Haircut */}
            <path
              d="M110 32 C82 32, 62 48, 56 75 C50 102, 52 128, 56 142 C58 148, 62 135, 66 112 C70 85, 78 52, 110 50 C142 52, 150 85, 154 112 C158 135, 162 148, 164 142 C168 128, 170 102, 164 75 C158 48, 138 32, 110 32 Z"
              fill="url(#hairGlow)"
              opacity="0.85"
            />

            {/* Forehead & Temple Holographic Glyph Circuitry */}
            <path
              d="M86 64 L102 70 L110 68 L118 70 L134 64"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="1.2"
              opacity="0.8"
            />
            <circle cx="110" cy="68" r="2.5" fill="#a5f3fc" />
            <circle cx="86" cy="64" r="1.8" fill="#67e8f9" />
            <circle cx="134" cy="64" r="1.8" fill="#67e8f9" />

            {/* Jawline & Chin Contour */}
            <path
              d="M72 115 C72 148, 86 174, 110 184 C134 174, 148 148, 148 115"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.8"
              opacity="0.75"
            />

            {/* Cheeks Cyber Contour Lines */}
            <path
              d="M80 128 C88 142, 98 152, 110 156 C122 152, 132 142, 140 128"
              fill="none"
              stroke="rgba(6, 182, 212, 0.3)"
              strokeWidth="1"
              strokeDasharray="2, 4"
            />

            {/* Slender Nose Contour */}
            <path
              d="M109 104 L110 128 L114 133 L106 133"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.2"
              opacity="0.75"
            />

            {/* Intelligent Luminous Cyan Eyes */}
            <g className="transition-all duration-150">
              {/* Left Eye */}
              <g transform="translate(86, 102)">
                <path
                  d="M-14 0 Q0 -6 14 0 Q0 6 -14 0 Z"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                />
                {!blinkState ? (
                  <>
                    <ellipse
                      cx="0"
                      cy="0"
                      rx={state === 'thinking' ? 4.5 : 5.5}
                      ry={state === 'thinking' ? 4.5 : 5.5}
                      fill="#a5f3fc"
                    />
                    <circle cx="0" cy="0" r="2" fill="#082f49" />
                    <circle cx="-1.5" cy="-1.5" r="1" fill="#ffffff" />
                  </>
                ) : (
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#67e8f9" strokeWidth="2" />
                )}
                {/* Eyebrow */}
                <path
                  d="M-15 -9 Q-2 -13 14 -8"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
              </g>

              {/* Right Eye */}
              <g transform="translate(134, 102)">
                <path
                  d="M-14 0 Q0 -6 14 0 Q0 6 -14 0 Z"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                />
                {!blinkState ? (
                  <>
                    <ellipse
                      cx="0"
                      cy="0"
                      rx={state === 'thinking' ? 4.5 : 5.5}
                      ry={state === 'thinking' ? 4.5 : 5.5}
                      fill="#a5f3fc"
                    />
                    <circle cx="0" cy="0" r="2" fill="#082f49" />
                    <circle cx="-1.5" cy="-1.5" r="1" fill="#ffffff" />
                  </>
                ) : (
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#67e8f9" strokeWidth="2" />
                )}
                {/* Eyebrow */}
                <path
                  d="M-14 -8 Q2 -13 15 -9"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
              </g>
            </g>

            {/* Reactive Holographic Mouth / Lips & Audio Frequency Visualizer */}
            <g transform="translate(110, 152)">
              {state === 'speaking' ? (
                <>
                  {/* Dynamic lip opening driven by real-time audio amplitude */}
                  <path
                    d={`M-14 0 Q0 ${-2 - audioLevel * 8} 14 0 Q0 ${3 + audioLevel * 10} -14 0 Z`}
                    fill="rgba(6, 182, 212, 0.35)"
                    stroke="#67e8f9"
                    strokeWidth="1.6"
                  />
                  {/* Internal vocal resonance line */}
                  <line
                    x1="-10"
                    y1="0"
                    x2="10"
                    y2="0"
                    stroke="#a5f3fc"
                    strokeWidth={1 + audioLevel * 2}
                  />
                </>
              ) : state === 'listening' ? (
                // Attentive soft parted lips
                <path
                  d="M-12 0 Q0 -3 12 0 Q0 2 -12 0 Z"
                  fill="rgba(6, 182, 212, 0.25)"
                  stroke="#38bdf8"
                  strokeWidth="1.4"
                />
              ) : (
                // Natural confident smile (Cortana's classic reassuring expression)
                <path
                  d="M-13 -1 Q0 4 13 -1"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              )}
            </g>

            {/* Intricate Digital Matrix Glyph Circuit on Temple/Neck */}
            <path
              d="M152 142 L160 156 L160 178 L148 190"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="3, 3"
              opacity="0.6"
            />
            <circle cx="160" cy="178" r="2" fill="#22d3ee" />

            <path
              d="M68 142 L60 156 L60 178 L72 190"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="3, 3"
              opacity="0.6"
            />
            <circle cx="60" cy="178" r="2" fill="#22d3ee" />
          </svg>

          {/* Hologram Scanlines Overlay over Avatar */}
          <div className="absolute inset-0 holo-scanlines rounded-full pointer-events-none opacity-60" />
        </div>
      </motion.div>

      {/* Futuristic Floating HUD Status Pill & Telemetry */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md text-xs font-mono text-cyan-300 shadow-lg shadow-cyan-950/40 z-20">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'speaking'
                ? 'bg-cyan-400 animate-ping'
                : state === 'listening'
                ? 'bg-emerald-400 animate-pulse'
                : state === 'thinking'
                ? 'bg-amber-400 animate-bounce'
                : state === 'analyzing'
                ? 'bg-indigo-400 animate-spin'
                : 'bg-cyan-500'
            }`}
          />
          <span className="tracking-widest uppercase font-semibold">
            {state === 'idle'
              ? 'HOLO-SYNC // NOMINAL'
              : state === 'listening'
              ? 'AUDIO RECEPTORS // ACTIVE'
              : state === 'thinking'
              ? 'QUANTUM MATRIX // PROCESSING'
              : state === 'speaking'
              ? 'VOCAL SYNTH // EMITTING'
              : 'OPTICAL SENSORS // SCANNING'}
          </span>
        </span>
        <span className="text-cyan-600 font-mono">|</span>
        <button
          onClick={triggerManualGlitch}
          title="Trigger Hologram Glitch Diagnostic"
          className="hover:text-cyan-100 transition-colors cursor-pointer text-[10px] tracking-wider text-cyan-400 uppercase"
        >
          [GLITCH TEST]
        </button>
      </div>
    </div>
  );
};
