import { useState, useEffect, useRef } from "react";

// ── Breathing patterns per mood/issue ──────────────────────────────────────

interface BreathPattern {
  name: string;
  inhale: number;   // seconds
  hold: number;
  exhale: number;
  holdOut?: number;
  tagline: string;
  color: string;    // tailwind text color class
}

const PATTERNS: Record<string, BreathPattern> = {
  anxiety: {
    name: "4-7-8 Calming",
    inhale: 4, hold: 7, exhale: 8,
    tagline: "Activates your parasympathetic nervous system",
    color: "text-violet-400",
  },
  stress: {
    name: "Box Breathing",
    inhale: 4, hold: 4, exhale: 4, holdOut: 4,
    tagline: "Used by Navy SEALs to reset under pressure",
    color: "text-blue-400",
  },
  depression: {
    name: "Energizing Breath",
    inhale: 6, hold: 2, exhale: 4,
    tagline: "Longer inhale lifts energy and mood",
    color: "text-emerald-400",
  },
  sleep: {
    name: "4-8 Wind-Down",
    inhale: 4, hold: 0, exhale: 8,
    tagline: "Slows heart rate to prepare for rest",
    color: "text-indigo-400",
  },
  relationship: {
    name: "Coherence Breathing",
    inhale: 5, hold: 0, exhale: 5,
    tagline: "5-second rhythm synchronizes heart and mind",
    color: "text-rose-400",
  },
};

const DEFAULT_PATTERN = PATTERNS.stress;

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface Props {
  issue?: string;
  active: boolean; // true while music is generating
}

export function BreathingExercise({ issue, active }: Props) {
  const pattern = (issue && PATTERNS[issue]) ? PATTERNS[issue] : DEFAULT_PATTERN;

  const [phase, setPhase] = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(pattern.inhale);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  // Phase sequence
  const getNextPhase = (p: Phase): Phase => {
    if (p === "inhale") return pattern.hold > 0 ? "hold" : "exhale";
    if (p === "hold") return "exhale";
    if (p === "exhale") return (pattern.holdOut && pattern.holdOut > 0) ? "holdOut" : "inhale";
    return "inhale";
  };

  const getDuration = (p: Phase): number => {
    if (p === "inhale") return pattern.inhale;
    if (p === "hold") return pattern.hold;
    if (p === "exhale") return pattern.exhale;
    if (p === "holdOut") return pattern.holdOut ?? 0;
    return 4;
  };

  useEffect(() => {
    if (!active) return;

    // Reset on mount
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

  // Circle scale: 0.4 → 1.0 on inhale, 1.0 on hold, 1.0 → 0.4 on exhale
  const totalPhase = getDuration(phase);
  const elapsed = totalPhase - secondsLeft;
  const progress = totalPhase > 0 ? elapsed / totalPhase : 0;

  let scale = 0.55;
  if (phase === "inhale") scale = 0.55 + 0.45 * progress;
  else if (phase === "hold") scale = 1.0;
  else if (phase === "exhale") scale = 1.0 - 0.45 * progress;
  else if (phase === "holdOut") scale = 0.55;

  const phaseLabels: Record<Phase, string> = {
    inhale: "Breathe in",
    hold: "Hold",
    exhale: "Breathe out",
    holdOut: "Hold",
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-1">
        <p className={`text-xs font-semibold uppercase tracking-widest ${pattern.color}`}>
          {pattern.name}
        </p>
        <p className="text-xs text-muted-foreground">{pattern.tagline}</p>
      </div>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center w-44 h-44">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
            transform: `scale(${scale})`,
            transition: "transform 1s linear",
          }}
        />
        {/* Main circle */}
        <div
          className="rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
          style={{
            width: "160px",
            height: "160px",
            transform: `scale(${scale})`,
            transition: "transform 1s linear",
          }}
        >
          <div className="text-center">
            <p className="font-bold text-2xl text-foreground tabular-nums leading-none">
              {secondsLeft}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{phaseLabels[phase]}</p>
          </div>
        </div>
      </div>

      {/* Phase indicator dots */}
      <div className="flex gap-2 items-center">
        {(["inhale", ...(pattern.hold > 0 ? ["hold"] : []), "exhale", ...(pattern.holdOut ? ["holdOut"] : [])] as Phase[]).map((p) => (
          <div
            key={p}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              phase === p ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {cycleCount === 0
          ? "Follow the circle with your breath"
          : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
      </p>

      <p className="text-xs text-muted-foreground/50 italic">
        Your music is being composed…
      </p>
    </div>
  );
}
