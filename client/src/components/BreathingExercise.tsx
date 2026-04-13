import { useState, useEffect, useRef, useMemo } from "react";

// ── Breathing patterns ───────────────────────────────────────────────────────

interface BreathPattern {
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdOut?: number;
  tagline: string;
  hue: number;
}

const PATTERNS: Record<string, BreathPattern> = {
  anxiety:     { name: "4-7-8 Calming",       inhale: 4, hold: 7, exhale: 8,              tagline: "Activates your parasympathetic nervous system", hue: 270 },
  stress:      { name: "Box Breathing",        inhale: 4, hold: 4, exhale: 4, holdOut: 4,  tagline: "Used by Navy SEALs to reset under pressure",    hue: 220 },
  depression:  { name: "Energizing Breath",    inhale: 6, hold: 2, exhale: 4,              tagline: "Longer inhale lifts energy and mood",            hue: 300 },
  sleep:       { name: "4-8 Wind-Down",        inhale: 4, hold: 0, exhale: 8,              tagline: "Slows heart rate to prepare for rest",           hue: 240 },
  relationship:{ name: "Coherence Breathing",  inhale: 5, hold: 0, exhale: 5,              tagline: "5-second rhythm synchronizes heart and mind",    hue: 340 },
};

const DEFAULT_PATTERN = PATTERNS.stress;

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface Props {
  issue?: string;
  active: boolean;
  fullscreen?: boolean;
}

// ── Dot particle field ────────────────────────────────────────────────────────
//
// 80 dots arranged in a circle-ish scatter pattern.
// On inhale  → dots drift outward (large spread radius)
// On exhale  → dots drift inward  (small spread radius)
// On hold    → dots gently shimmer at current radius

interface Dot {
  id: number;
  // base angle in radians — fixed
  angle: number;
  // base radius multiplier 0..1 — randomises which ring the dot lives in
  radiusFactor: number;
  // small random size variation
  size: number;
  // opacity layer so outer dots are fainter
  baseOpacity: number;
  // individual stagger offset so they don't all move at once
  staggerMs: number;
}

function buildDots(count: number): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < count; i++) {
    // Fibonacci sunflower angle for natural scatter
    const goldenAngle = 2.399963; // radians  (137.5°)
    const angle = i * goldenAngle;
    // radius grows with sqrt(i) for even density, then normalised to 0..1
    const radiusFactor = 0.25 + 0.75 * Math.sqrt(i / count);
    const size = 3 + ((i * 17 + 7) % 5) * 1.2;
    const baseOpacity = 0.35 + 0.55 * (1 - radiusFactor * 0.6); // inner = brighter
    const staggerMs = (i * 12) % 320; // stagger 0–320ms across dots
    dots.push({ id: i, angle, radiusFactor, size, baseOpacity, staggerMs });
  }
  return dots;
}

const DOTS = buildDots(80);
const COMPACT_DOTS = buildDots(36);

// ── Animated dot field component ─────────────────────────────────────────────

function DotField({
  phase,
  hue,
  phaseDuration, // seconds
  containerSize, // px — square
  minRadius,
  maxRadius,
  dots,
}: {
  phase: Phase;
  hue: number;
  phaseDuration: number;
  containerSize: number;
  minRadius: number;
  maxRadius: number;
  dots: Dot[];
}) {
  const cx = containerSize / 2;
  const cy = containerSize / 2;

  // Target radius for each phase
  const targetR = (phase === "inhale" || phase === "hold") ? maxRadius : minRadius;

  const col = `hsl(${hue}, 78%, 68%)`;
  const colDim = `hsl(${hue}, 60%, 50%)`;

  // Easing: inhale = ease-out (fast open), exhale = ease-in (slow close then release)
  const easingMap: Record<Phase, string> = {
    inhale:  "cubic-bezier(0.2, 0, 0.4, 1)",   // quick bloom
    hold:    "ease-in-out",
    exhale:  "cubic-bezier(0.6, 0, 0.8, 1)",   // slow graceful draw-in
    holdOut: "ease-in-out",
  };
  const easing = easingMap[phase];

  return (
    <svg
      width={containerSize}
      height={containerSize}
      style={{ overflow: "visible", display: "block" }}
      aria-hidden
    >
      {dots.map((dot) => {
        const r = targetR * dot.radiusFactor;
        const x = cx + Math.cos(dot.angle) * r;
        const y = cy + Math.sin(dot.angle) * r;
        const opacity = dot.baseOpacity * (phase === "hold" || phase === "holdOut" ? 0.75 : 1);
        // Scale dot itself: bigger at full inhale, smaller at exhale
        const dotScale = phase === "inhale" || phase === "hold"
          ? 0.85 + 0.15 * dot.radiusFactor
          : 0.6 + 0.15 * dot.radiusFactor;

        return (
          <circle
            key={dot.id}
            cx={x}
            cy={y}
            r={dot.size * dotScale / 2}
            fill={dot.radiusFactor > 0.6 ? colDim : col}
            opacity={opacity}
            style={{
              transition: `cx ${phaseDuration}s ${easing} ${dot.staggerMs}ms,
                           cy ${phaseDuration}s ${easing} ${dot.staggerMs}ms,
                           r  ${phaseDuration}s ${easing} ${dot.staggerMs}ms,
                           opacity ${phaseDuration * 0.4}s ease`,
            }}
          />
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

  const phaseDur = getDuration(phase);
  const orbColor = `hsl(${pattern.hue}, 78%, 62%)`;

  const phaseConfig: Record<Phase, { label: string; instruction: string; bgAlpha: string }> = {
    inhale:  { label: "Breathe In",  instruction: "Let your lungs fill completely",   bgAlpha: `hsla(${pattern.hue}, 80%, 55%, 0.18)` },
    hold:    { label: "Hold",        instruction: "Stay still — feel the fullness",   bgAlpha: `hsla(${pattern.hue}, 60%, 45%, 0.12)` },
    exhale:  { label: "Breathe Out", instruction: "Release everything slowly",        bgAlpha: `hsla(${pattern.hue + 25}, 65%, 40%, 0.15)` },
    holdOut: { label: "Hold",        instruction: "Rest here a moment",               bgAlpha: `hsla(${pattern.hue + 25}, 55%, 35%, 0.09)` },
  };

  const cfg = phaseConfig[phase];

  const phaseList = ([
    "inhale",
    ...(pattern.hold    > 0 ? ["hold"]    : []),
    "exhale",
    ...(pattern.holdOut ? ["holdOut"] : []),
  ] as Phase[]);

  // ── Fullscreen ───────────────────────────────────────────────────────────────

  if (fullscreen) {
    const SIZE = 320;     // svg canvas
    const MAX_R = 140;    // dots at full inhale
    const MIN_R = 58;     // dots at full exhale

    return (
      <div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden select-none"
        style={{ background: "hsl(0 0% 4%)" }}
      >
        {/* Animated CSS for background glow */}
        <style>{`
          @keyframes bg-breathe-in {
            from { opacity: 0.5; }
            to   { opacity: 1;   }
          }
          @keyframes bg-breathe-out {
            from { opacity: 1;   }
            to   { opacity: 0.5; }
          }
          @keyframes text-fade {
            from { opacity: 0; transform: translateY(5px); }
            to   { opacity: 1; transform: translateY(0);   }
          }
          @keyframes hold-shimmer {
            0%, 100% { opacity: 0.82; }
            50%      { opacity: 1;    }
          }
        `}</style>

        {/* Ambient radial background — shifts with phase */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 50% 46%, ${cfg.bgAlpha}, transparent 65%)`,
            transition: `background ${phaseDur}s ease`,
          }}
        />

        {/* Pattern label top */}
        <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30">{pattern.name}</p>
          <p className="text-[10px] text-white/18 mt-0.5">{pattern.tagline}</p>
        </div>

        {/* ── DOT FIELD ── */}
        <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>

          {/* Faint core glow behind the dots */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: MIN_R * 2,
              height: MIN_R * 2,
              background: `radial-gradient(circle, ${orbColor}28 0%, transparent 70%)`,
              boxShadow: `0 0 60px 20px ${orbColor}18`,
              transition: `box-shadow ${phaseDur}s ease, width ${phaseDur}s ease, height ${phaseDur}s ease`,
              ...(phase === "inhale" || phase === "hold" ? {
                width: MAX_R * 2,
                height: MAX_R * 2,
                background: `radial-gradient(circle, ${orbColor}1a 0%, transparent 65%)`,
                boxShadow: `0 0 90px 35px ${orbColor}22`,
              } : {}),
            }}
          />

          {/* The dot field itself */}
          <div className="absolute inset-0">
            <DotField
              phase={phase}
              hue={pattern.hue}
              phaseDuration={phaseDur}
              containerSize={SIZE}
              minRadius={MIN_R}
              maxRadius={MAX_R}
              dots={DOTS}
            />
          </div>

          {/* Center timer pill — sits on top of dots */}
          <div
            className="relative z-10 flex flex-col items-center justify-center"
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: `radial-gradient(circle, ${orbColor}40 0%, ${orbColor}12 70%)`,
              border: `1.5px solid ${orbColor}55`,
              boxShadow: `0 0 24px 6px ${orbColor}33`,
            }}
          >
            <span
              className="font-bold text-white tabular-nums leading-none"
              style={{ fontSize: 30, textShadow: `0 0 16px ${orbColor}cc` }}
            >
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* Phase label */}
        <div
          key={`label-${phase}`}
          className="mt-8 text-center space-y-1.5"
          style={{ animation: "text-fade 0.45s ease forwards" }}
        >
          <p
            className="text-[1.5rem] font-bold tracking-wide text-white"
            style={{ textShadow: `0 0 30px ${orbColor}aa` }}
          >
            {cfg.label}
          </p>
          <p className="text-[13px] text-white/40">{cfg.instruction}</p>
        </div>

        {/* Phase progress bar */}
        <div className="mt-7 flex items-center gap-2">
          {phaseList.map(p => (
            <div
              key={p}
              className="rounded-full transition-all duration-500"
              style={{
                height: 3,
                width:   phase === p ? 30 : 7,
                background: phase === p ? orbColor : "rgba(255,255,255,0.16)",
              }}
            />
          ))}
        </div>

        {/* Cycle counter */}
        <p className="mt-5 text-xs text-white/25">
          {cycleCount === 0
            ? "Follow the dots — let them guide your breath"
            : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
        </p>
      </div>
    );
  }

  // ── Compact variant (Assessment / Presets) ────────────────────────────────

  const C_SIZE = 180;
  const C_MAX = 78;
  const C_MIN = 32;

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-5">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{pattern.name}</p>
        <p className="text-xs text-muted-foreground">{pattern.tagline}</p>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: C_SIZE, height: C_SIZE }}>
        {/* Compact dot field */}
        <DotField
          phase={phase}
          hue={pattern.hue}
          phaseDuration={phaseDur}
          containerSize={C_SIZE}
          minRadius={C_MIN}
          maxRadius={C_MAX}
          dots={COMPACT_DOTS}
        />

        {/* Center timer */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            background: "hsl(var(--primary) / 0.18)",
            border: "1.5px solid hsl(var(--primary) / 0.4)",
          }}
        >
          <p className="font-bold text-xl text-foreground tabular-nums leading-none">{secondsLeft}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">{cfg.label}</p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {phaseList.map(p => (
          <div
            key={p}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              phase === p ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {cycleCount === 0 ? "Follow the dots with your breath" : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
      </p>
      <p className="text-xs text-muted-foreground/50 italic">Your music is being composed…</p>
    </div>
  );
}
