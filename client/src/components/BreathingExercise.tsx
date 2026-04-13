import { useState, useEffect, useRef } from "react";

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
// Dots arranged in a Fibonacci sunflower scatter pattern.
// On inhale  → dots drift outward
// On exhale  → dots drift inward
// ClipPath ensures clean circular containment — no overflow distortion

interface Dot {
  id: number;
  angle: number;
  radiusFactor: number;
  size: number;
  baseOpacity: number;
  staggerMs: number;
}

function buildDots(count: number): Dot[] {
  const dots: Dot[] = [];
  for (let i = 0; i < count; i++) {
    const goldenAngle = 2.399963; // 137.5°
    const angle = i * goldenAngle;
    const radiusFactor = 0.25 + 0.75 * Math.sqrt(i / count);
    const size = 3 + ((i * 17 + 7) % 5) * 1.2;
    const baseOpacity = 0.35 + 0.55 * (1 - radiusFactor * 0.6);
    const staggerMs = (i * 12) % 320;
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
  phaseDuration,
  containerSize,
  minRadius,
  maxRadius,
  dots,
  clipId,
}: {
  phase: Phase;
  hue: number;
  phaseDuration: number;
  containerSize: number;
  minRadius: number;
  maxRadius: number;
  dots: Dot[];
  clipId: string;
}) {
  const cx = containerSize / 2;
  const cy = containerSize / 2;
  const clipR = maxRadius + 8; // clip circle is slightly bigger than max spread

  const targetR = (phase === "inhale" || phase === "hold") ? maxRadius : minRadius;

  const col    = `hsl(${hue}, 78%, 68%)`;
  const colDim = `hsl(${hue}, 60%, 50%)`;

  const easingMap: Record<Phase, string> = {
    inhale:  "cubic-bezier(0.2, 0, 0.4, 1)",
    hold:    "ease-in-out",
    exhale:  "cubic-bezier(0.6, 0, 0.8, 1)",
    holdOut: "ease-in-out",
  };
  const easing = easingMap[phase];

  return (
    <svg
      width={containerSize}
      height={containerSize}
      style={{ overflow: "hidden", display: "block" }}
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={clipR} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {dots.map((dot) => {
          const r = targetR * dot.radiusFactor;
          const x = cx + Math.cos(dot.angle) * r;
          const y = cy + Math.sin(dot.angle) * r;
          const opacity = dot.baseOpacity * (phase === "hold" || phase === "holdOut" ? 0.75 : 1);
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
      </g>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BreathingExercise({ issue, active, fullscreen = false }: Props) {
  const pattern = (issue && PATTERNS[issue]) ? PATTERNS[issue] : DEFAULT_PATTERN;

  const [phase, setPhase]            = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(pattern.inhale);
  const [cycleCount, setCycleCount]  = useState(0);

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

  const phaseConfig: Record<Phase, { label: string; instruction: string; bgAlpha: string; hueShift: number }> = {
    inhale:  { label: "Breathe In",  instruction: "Let your lungs fill completely",   bgAlpha: `hsla(${pattern.hue}, 80%, 55%, 0.22)`,      hueShift: 0 },
    hold:    { label: "Hold",        instruction: "Stay still — feel the fullness",   bgAlpha: `hsla(${pattern.hue}, 60%, 45%, 0.16)`,      hueShift: 5 },
    exhale:  { label: "Breathe Out", instruction: "Release everything slowly",        bgAlpha: `hsla(${pattern.hue + 25}, 65%, 35%, 0.18)`, hueShift: 25 },
    holdOut: { label: "Hold",        instruction: "Rest here a moment",               bgAlpha: `hsla(${pattern.hue + 30}, 55%, 30%, 0.12)`, hueShift: 30 },
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
    const SIZE  = 320;
    const MAX_R = 140;
    const MIN_R = 58;

    // Feature B: the whole background hue shifts gently with each phase
    const bgHue = pattern.hue + cfg.hueShift;
    const isExpanded = phase === "inhale" || phase === "hold";

    return (
      <div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden select-none"
        style={{
          background: `hsl(${bgHue}, 12%, 5%)`,
          transition: `background ${phaseDur}s ease`,
        }}
      >
        <style>{`
          @keyframes text-fade {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0);   }
          }
        `}</style>

        {/* Feature B: animated radial glow — shifts color with phase */}
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

          {/* Core glow — breathes with phase */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width:  isExpanded ? MAX_R * 2 : MIN_R * 2,
              height: isExpanded ? MAX_R * 2 : MIN_R * 2,
              background: `radial-gradient(circle, ${orbColor}${isExpanded ? "1a" : "28"} 0%, transparent 65%)`,
              boxShadow: `0 0 ${isExpanded ? "90px 35px" : "60px 20px"} ${orbColor}${isExpanded ? "22" : "18"}`,
              transition: `width ${phaseDur}s ease, height ${phaseDur}s ease, box-shadow ${phaseDur}s ease`,
            }}
          />

          {/* The dot field */}
          <div className="absolute inset-0">
            <DotField
              phase={phase}
              hue={pattern.hue}
              phaseDuration={phaseDur}
              containerSize={SIZE}
              minRadius={MIN_R}
              maxRadius={MAX_R}
              dots={DOTS}
              clipId="fullscreen-dots-clip"
            />
          </div>

          {/* Center timer pill */}
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

        {/* Phase progress dots */}
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

  const C_SIZE = 200;
  const C_MAX  = 88;
  const C_MIN  = 36;

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-5">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{pattern.name}</p>
        <p className="text-xs text-muted-foreground">{pattern.tagline}</p>
      </div>

      {/* Compact dot field — clipped to a tidy circle */}
      <div className="relative flex items-center justify-center" style={{ width: C_SIZE, height: C_SIZE }}>
        <DotField
          phase={phase}
          hue={pattern.hue}
          phaseDuration={phaseDur}
          containerSize={C_SIZE}
          minRadius={C_MIN}
          maxRadius={C_MAX}
          dots={COMPACT_DOTS}
          clipId="compact-dots-clip"
        />

        {/* Center timer */}
        <div
          className="absolute z-10 flex flex-col items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
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
