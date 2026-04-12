import { useState, useEffect, useRef } from "react";

// ── Breathing patterns per mood/issue ──────────────────────────────────────

interface BreathPattern {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdOut?: number;
  tagline: string;
  // HSL values for ambient gradient (no hsl() wrapper)
  hue: number;
}

const PATTERNS: Record<string, BreathPattern> = {
  anxiety:  { name: "4-7-8 Calming",        inhale: 4, hold: 7, exhale: 8,               tagline: "Activates your parasympathetic nervous system", hue: 270 },
  stress:   { name: "Box Breathing",          inhale: 4, hold: 4, exhale: 4, holdOut: 4,  tagline: "Used by Navy SEALs to reset under pressure",     hue: 220 },
  depression:{ name: "Energizing Breath",     inhale: 6, hold: 2, exhale: 4,              tagline: "Longer inhale lifts energy and mood",             hue: 300 },
  sleep:    { name: "4-8 Wind-Down",          inhale: 4, hold: 0, exhale: 8,              tagline: "Slows heart rate to prepare for rest",            hue: 240 },
  relationship:{ name: "Coherence Breathing", inhale: 5, hold: 0, exhale: 5,             tagline: "5-second rhythm synchronizes heart and mind",      hue: 340 },
};

const DEFAULT_PATTERN = PATTERNS.stress;

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface Props {
  issue?: string;
  active: boolean;
  fullscreen?: boolean; // when true: takes over full viewport
}

// Seeded floating particle positions (stable — no re-render jitter)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 100),
  y: ((i * 53 + 7)  % 100),
  size: 3 + (i % 4) * 2,
  delay: (i * 0.4) % 3,
  dur: 4 + (i % 5),
}));

export function BreathingExercise({ issue, active, fullscreen = false }: Props) {
  const pattern = (issue && PATTERNS[issue]) ? PATTERNS[issue] : DEFAULT_PATTERN;

  const [phase, setPhase]           = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(pattern.inhale);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  const getNextPhase = (p: Phase): Phase => {
    if (p === "inhale")   return pattern.hold > 0 ? "hold" : "exhale";
    if (p === "hold")     return "exhale";
    if (p === "exhale")   return (pattern.holdOut && pattern.holdOut > 0) ? "holdOut" : "inhale";
    return "inhale";
  };

  const getDuration = (p: Phase): number => {
    if (p === "inhale")  return pattern.inhale;
    if (p === "hold")    return pattern.hold;
    if (p === "exhale")  return pattern.exhale;
    if (p === "holdOut") return pattern.holdOut ?? 0;
    return 4;
  };

  useEffect(() => {
    if (!active) return;
    setPhase("inhale");
    setSecondsLeft(pattern.inhale);
    setCycleCount(0);

    let currentPhase: Phase = "inhale";
    let currentSeconds = pattern.inhale;

    const tick = () => {
      if (!activeRef.current) return;
      currentSeconds -= 1;
      if (currentSeconds <= 0) {
        const next = getNextPhase(currentPhase);
        if (next === "inhale") setCycleCount(c => c + 1);
        currentPhase = next;
        currentSeconds = getDuration(next);
        setPhase(next);
      }
      setSecondsLeft(currentSeconds);
      timerRef.current = setTimeout(tick, 1000);
    };

    timerRef.current = setTimeout(tick, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, issue]);

  if (!active) return null;

  // ── Scale calculation ──
  const totalPhase = getDuration(phase);
  const elapsed    = totalPhase - secondsLeft;
  const progress   = totalPhase > 0 ? elapsed / totalPhase : 0;

  let scale = 0.52;
  if      (phase === "inhale")  scale = 0.52 + 0.48 * progress;
  else if (phase === "hold")    scale = 1.0;
  else if (phase === "exhale")  scale = 1.0 - 0.48 * progress;
  else if (phase === "holdOut") scale = 0.52;

  // ── Phase info ──
  const phaseConfig: Record<Phase, { label: string; instruction: string; bg: string }> = {
    inhale:  { label: "Breathe in",  instruction: "Expand your chest slowly",    bg: `hsla(${pattern.hue}, 80%, 55%, 0.18)` },
    hold:    { label: "Hold",        instruction: "Stay still, feel the pause",  bg: `hsla(${pattern.hue}, 60%, 45%, 0.12)` },
    exhale:  { label: "Breathe out", instruction: "Let everything release",      bg: `hsla(${pattern.hue + 30}, 70%, 40%, 0.14)` },
    holdOut: { label: "Hold",        instruction: "Rest here a moment",          bg: `hsla(${pattern.hue + 30}, 60%, 35%, 0.10)` },
  };

  const cfg = phaseConfig[phase];

  const phaseList = ([
    "inhale",
    ...(pattern.hold    > 0 ? ["hold"]    : []),
    "exhale",
    ...(pattern.holdOut ? ["holdOut"] : []),
  ] as Phase[]);

  // ── Glow color for the orb ──
  const orbGlow = `hsl(${pattern.hue}, 80%, 60%)`;

  const transitionDuration = `${getDuration(phase)}s`;

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "hsl(0 0% 4%)" }}
      >
        {/* Ambient background gradient — shifts per phase */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${cfg.bg}, transparent 70%)`,
            transition: `background ${transitionDuration} ease-in-out`,
          }}
        />

        {/* Floating ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {PARTICLES.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left:   `${p.x}%`,
                top:    `${p.y}%`,
                width:  `${p.size}px`,
                height: `${p.size}px`,
                background: orbGlow,
                opacity: 0.15 + (scale - 0.5) * 0.3,
                animation: `particle-float ${p.dur}s ${p.delay}s ease-in-out infinite alternate`,
                transform: `scale(${0.7 + scale * 0.5})`,
                transition: `transform ${transitionDuration} ease-in-out, opacity ${transitionDuration} ease-in-out`,
              }}
            />
          ))}
        </div>

        {/* Pattern label at top */}
        <div className="absolute top-8 left-0 right-0 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{pattern.name}</p>
          <p className="text-[11px] text-white/25 mt-1">{pattern.tagline}</p>
        </div>

        {/* The orb */}
        <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
          {/* Outermost halo — very faint */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 280, height: 280,
              background: `radial-gradient(circle, ${orbGlow}22 0%, transparent 70%)`,
              transform: `scale(${0.6 + scale * 0.7})`,
              transition: `transform ${transitionDuration} ease-in-out`,
            }}
          />
          {/* Mid glow ring */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 220, height: 220,
              background: `radial-gradient(circle, ${orbGlow}33 0%, transparent 65%)`,
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration} ease-in-out`,
            }}
          />
          {/* Core orb */}
          <div
            className="absolute rounded-full"
            style={{
              width: 160, height: 160,
              background: `radial-gradient(circle at 38% 38%, ${orbGlow}99 0%, hsl(${pattern.hue}, 65%, 25%) 60%, hsl(${pattern.hue}, 50%, 12%) 100%)`,
              boxShadow: `0 0 40px 10px ${orbGlow}55, inset 0 0 30px ${orbGlow}22`,
              border: `1.5px solid ${orbGlow}55`,
              transform: `scale(${scale})`,
              transition: `transform ${transitionDuration} ease-in-out`,
            }}
          >
            {/* Inner content */}
            <div className="flex flex-col items-center justify-center h-full">
              <p className="font-bold text-4xl text-white tabular-nums leading-none"
                style={{ textShadow: `0 0 20px ${orbGlow}` }}>
                {secondsLeft}
              </p>
            </div>
          </div>
        </div>

        {/* Phase label */}
        <div className="mt-10 text-center space-y-2">
          <p
            className="text-2xl font-semibold tracking-wide text-white"
            style={{ textShadow: `0 0 30px ${orbGlow}99`, transition: "all 0.6s ease" }}
          >
            {cfg.label}
          </p>
          <p className="text-sm text-white/40">{cfg.instruction}</p>
        </div>

        {/* Phase dots */}
        <div className="mt-8 flex gap-2.5 items-center">
          {phaseList.map((p) => (
            <div
              key={p}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: phase === p ? 28 : 6,
                background: phase === p ? orbGlow : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>

        {/* Cycle count */}
        <p className="mt-6 text-xs text-white/30">
          {cycleCount === 0
            ? "Follow the orb — breathe with it"
            : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
        </p>

        {/* Keyframe styles */}
        <style>{`
          @keyframes particle-float {
            0%   { transform: translateY(0px) translateX(0px); }
            100% { transform: translateY(-18px) translateX(8px); }
          }
        `}</style>
      </div>
    );
  }

  // ── Compact (non-fullscreen) variant — used in Assessment/Presets ──
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{pattern.name}</p>
        <p className="text-xs text-muted-foreground">{pattern.tagline}</p>
      </div>

      <div className="relative flex items-center justify-center w-44 h-44">
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            transform: `scale(${scale})`,
            transition: `transform ${transitionDuration} linear`,
          }}
        />
        <div
          className="rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
          style={{
            width: 160, height: 160,
            transform: `scale(${scale})`,
            transition: `transform ${transitionDuration} linear`,
          }}
        >
          <div className="text-center">
            <p className="font-bold text-2xl text-foreground tabular-nums leading-none">{secondsLeft}</p>
            <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {phaseList.map((p) => (
          <div
            key={p}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              phase === p ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {cycleCount === 0 ? "Follow the circle with your breath" : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
      </p>
      <p className="text-xs text-muted-foreground/50 italic">Your music is being composed…</p>
    </div>
  );
}
