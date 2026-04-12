import { useState, useEffect, useRef } from "react";

// ── Breathing patterns ──────────────────────────────────────────────────────

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
  relationship:{ name: "Coherence Breathing",  inhale: 5, hold: 0, exhale: 5,             tagline: "5-second rhythm synchronizes heart and mind",    hue: 340 },
};

const DEFAULT_PATTERN = PATTERNS.stress;

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface Props {
  issue?: string;
  active: boolean;
  fullscreen?: boolean;
}

// Stable particle positions
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 100),
  y: ((i * 53 + 7)  % 100),
  size: 2 + (i % 5) * 1.5,
  delay: (i * 0.35) % 4,
  dur: 5 + (i % 6),
}));

export function BreathingExercise({ issue, active, fullscreen = false }: Props) {
  const pattern = (issue && PATTERNS[issue]) ? PATTERNS[issue] : DEFAULT_PATTERN;

  const [phase, setPhase]             = useState<Phase>("inhale");
  const [secondsLeft, setSecondsLeft] = useState(pattern.inhale);
  const [cycleCount, setCycleCount]   = useState(0);
  // animationKey changes every phase to restart CSS animations cleanly
  const [animationKey, setAnimationKey] = useState(0);

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
    setAnimationKey(k => k + 1);

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
        setAnimationKey(k => k + 1); // restart CSS animation for new phase
      }
      setSecondsLeft(currentSeconds);
      timerRef.current = setTimeout(tick, 1000);
    };

    timerRef.current = setTimeout(tick, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, issue]);

  if (!active) return null;

  const phaseDur   = getDuration(phase);
  const orbColor   = `hsl(${pattern.hue}, 78%, 62%)`;
  const orbColorDim= `hsl(${pattern.hue}, 60%, 40%)`;

  // ── Phase display config ──
  const phaseConfig: Record<Phase, { label: string; instruction: string; bgAlpha: string }> = {
    inhale:  { label: "Breathe In",  instruction: "Let your lungs fill completely",   bgAlpha: `hsla(${pattern.hue}, 80%, 55%, 0.20)` },
    hold:    { label: "Hold",        instruction: "Stay still — feel the fullness",   bgAlpha: `hsla(${pattern.hue}, 60%, 45%, 0.13)` },
    exhale:  { label: "Breathe Out", instruction: "Release everything slowly",        bgAlpha: `hsla(${pattern.hue + 25}, 65%, 40%, 0.16)` },
    holdOut: { label: "Hold",        instruction: "Rest here a moment",               bgAlpha: `hsla(${pattern.hue + 25}, 55%, 35%, 0.10)` },
  };

  const cfg = phaseConfig[phase];

  const phaseList = ([
    "inhale",
    ...(pattern.hold    > 0 ? ["hold"]    : []),
    "exhale",
    ...(pattern.holdOut ? ["holdOut"] : []),
  ] as Phase[]);

  // ── CSS animation name per phase ──
  // inhale  → grow from 0.48 → 1.0 (linear over phaseDur seconds)
  // hold    → stay at scale 1.0 (pulse gently)
  // exhale  → shrink from 1.0 → 0.48
  // holdOut → stay at scale 0.48
  const getAnimStyle = (baseSize: number): React.CSSProperties => {
    const minScale = 0.42, maxScale = 1.0;
    if (phase === "inhale") {
      return {
        animation: `orb-inhale-${animationKey} ${phaseDur}s linear forwards`,
      };
    } else if (phase === "hold") {
      return {
        animation: `orb-hold-${animationKey} ${phaseDur}s ease-in-out infinite`,
        transform: `scale(${maxScale})`,
      };
    } else if (phase === "exhale") {
      return {
        animation: `orb-exhale-${animationKey} ${phaseDur}s linear forwards`,
      };
    } else {
      return {
        transform: `scale(${minScale})`,
        animation: `orb-holdout-${animationKey} ${phaseDur}s ease-in-out infinite`,
      };
    }
  };

  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden select-none"
        style={{ background: "hsl(0 0% 4%)" }}
      >
        {/* Injected CSS keyframes — unique per animationKey so they restart cleanly */}
        <style>{`
          /* ── Orb animations for phase ${phase} key ${animationKey} ── */
          @keyframes orb-inhale-${animationKey} {
            from { transform: scale(0.42); }
            to   { transform: scale(1.0);  }
          }
          @keyframes orb-exhale-${animationKey} {
            from { transform: scale(1.0);  }
            to   { transform: scale(0.42); }
          }
          @keyframes orb-hold-${animationKey} {
            0%, 100% { transform: scale(1.0);    }
            50%       { transform: scale(1.025);  }
          }
          @keyframes orb-holdout-${animationKey} {
            0%, 100% { transform: scale(0.42);   }
            50%       { transform: scale(0.435);  }
          }
          @keyframes particle-drift {
            0%   { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.12; }
            50%  { transform: translateY(-22px) translateX(10px) scale(1.3); opacity: 0.22; }
            100% { transform: translateY(-8px) translateX(-6px) scale(0.9); opacity: 0.08; }
          }
          @keyframes text-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0px); }
          }
        `}</style>

        {/* Ambient background that shifts with phase */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-[3s]"
          style={{
            background: `radial-gradient(ellipse 85% 75% at 50% 48%, ${cfg.bgAlpha}, transparent 68%)`,
          }}
        />

        {/* Floating ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {PARTICLES.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top:  `${p.y}%`,
                width:  `${p.size}px`,
                height: `${p.size}px`,
                background: orbColor,
                animation: `particle-drift ${p.dur}s ${p.delay}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        {/* Top label */}
        <div className="absolute top-8 left-0 right-0 text-center pointer-events-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30">{pattern.name}</p>
          <p className="text-[10px] text-white/18 mt-0.5">{pattern.tagline}</p>
        </div>

        {/* ── THE ORB ── */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 300, height: 300 }}
        >
          {/* Outer halo — faintest, biggest */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 300, height: 300,
              background: `radial-gradient(circle, ${orbColor}18 0%, transparent 65%)`,
              ...getAnimStyle(300),
            }}
          />

          {/* Mid glow */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 230, height: 230,
              background: `radial-gradient(circle, ${orbColor}2e 0%, transparent 65%)`,
              ...getAnimStyle(230),
            }}
          />

          {/* Core orb — most visible, has inner content */}
          <div
            className="absolute rounded-full flex items-center justify-center overflow-hidden"
            style={{
              width: 155, height: 155,
              background: `radial-gradient(circle at 35% 32%, ${orbColor}bb 0%, ${orbColorDim} 55%, hsl(${pattern.hue}, 40%, 10%) 100%)`,
              boxShadow: `0 0 55px 18px ${orbColor}44, 0 0 110px 40px ${orbColor}1a, inset 0 1px 0 ${orbColor}44`,
              border: `1.5px solid ${orbColor}66`,
              ...getAnimStyle(155),
            }}
          >
            {/* Timer number */}
            <span
              className="font-bold text-white tabular-nums leading-none"
              style={{
                fontSize: 42,
                textShadow: `0 0 24px ${orbColor}cc, 0 0 8px #fff8`,
              }}
            >
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* Phase label — re-animates on phase change */}
        <div
          key={`label-${animationKey}`}
          className="mt-10 text-center space-y-2"
          style={{ animation: "text-fade-in 0.5s ease forwards" }}
        >
          <p
            className="text-[1.6rem] font-bold tracking-wide text-white"
            style={{ textShadow: `0 0 36px ${orbColor}bb` }}
          >
            {cfg.label}
          </p>
          <p className="text-[13px] text-white/40">{cfg.instruction}</p>
        </div>

        {/* Phase progress dots */}
        <div className="mt-8 flex items-center gap-2.5">
          {phaseList.map(p => (
            <div
              key={p}
              className="rounded-full transition-all duration-500"
              style={{
                height: 3,
                width:   phase === p ? 32 : 7,
                background: phase === p ? orbColor : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>

        {/* Cycle counter */}
        <p className="mt-5 text-xs text-white/25">
          {cycleCount === 0
            ? "Follow the orb — let it guide your breath"
            : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
        </p>
      </div>
    );
  }

  // ── Compact variant (used in Assessment page) ──────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      <style>{`
        @keyframes orb-inhale-${animationKey} {
          from { transform: scale(0.42); }
          to   { transform: scale(1.0);  }
        }
        @keyframes orb-exhale-${animationKey} {
          from { transform: scale(1.0);  }
          to   { transform: scale(0.42); }
        }
        @keyframes orb-hold-${animationKey} {
          0%, 100% { transform: scale(1.0);   }
          50%       { transform: scale(1.03);  }
        }
        @keyframes orb-holdout-${animationKey} {
          0%, 100% { transform: scale(0.42);  }
          50%       { transform: scale(0.44);  }
        }
      `}</style>

      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{pattern.name}</p>
        <p className="text-xs text-muted-foreground">{pattern.tagline}</p>
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 180, height: 180,
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            ...getAnimStyle(180),
          }}
        />
        <div
          className="absolute rounded-full border border-primary/40 flex items-center justify-center"
          style={{
            width: 130, height: 130,
            background: "hsl(var(--primary) / 0.12)",
            ...getAnimStyle(130),
          }}
        >
          <div className="text-center">
            <p className="font-bold text-2xl text-foreground tabular-nums">{secondsLeft}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
          </div>
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
        {cycleCount === 0 ? "Follow the circle with your breath" : `${cycleCount} ${cycleCount === 1 ? "cycle" : "cycles"} completed`}
      </p>
      <p className="text-xs text-muted-foreground/50 italic">Your music is being composed…</p>
    </div>
  );
}
