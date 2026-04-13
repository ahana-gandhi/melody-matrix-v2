import { useState, useEffect, useRef } from "react";
import { generateMusic } from "@/services/lyria";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BreathingExercise } from "@/components/BreathingExercise";
import { FeedbackSurvey } from "@/components/FeedbackSurvey";
import { SessionSummaryCard } from "@/components/SessionSummaryCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, RefreshCw, CheckCircle, Wind, PenLine, Sparkles,
  ChevronRight, MessageSquare,
} from "lucide-react";
import type { Issue, Instrument } from "@/lib/promptBuilder";

// ── Session themes ─────────────────────────────────────────────────────────

interface SessionTheme {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  issue: Issue;
  instrument: Instrument;
  tempo: number;
  breathDuration: number;
  prompt: string;
  reflectionPrompt: string;
  hue: number;
  gradient: string;
}

const THEMES: SessionTheme[] = [
  {
    id: "calm-anxiety", label: "Calm my anxiety", subtitle: "Release tension & slow down",
    icon: "🫁", issue: "anxiety", instrument: "flute", tempo: 65, breathDuration: 90,
    hue: 270,
    gradient: "from-violet-950/80 to-purple-900/40",
    prompt: "Compose a 65 BPM calming piece using airy flute melodies with flowing phrases. Focus: calming heightened worry and restlessness. Use spacious, soothing textures that encourage deep breathing. Evolving layers, smooth transitions, gentle resolution.",
    reflectionPrompt: "What feels different in your body right now compared to before?",
  },
  {
    id: "wind-down", label: "Wind down for sleep", subtitle: "Ease into restful stillness",
    icon: "🌙", issue: "sleep", instrument: "piano", tempo: 58, breathDuration: 120,
    hue: 230,
    gradient: "from-indigo-950/80 to-blue-900/40",
    prompt: "Compose a 58 BPM lullaby using warm resonant piano with very slow arpeggios. Focus: guiding toward restful sleep. Extremely gentle dynamics, descending phrases, long held tones. Conclude with near-silence.",
    reflectionPrompt: "How ready for rest do you feel now? Anything still on your mind?",
  },
  {
    id: "release-stress", label: "Release stress", subtitle: "Let the pressure exhale",
    icon: "⚡", issue: "stress", instrument: "guitar", tempo: 72, breathDuration: 90,
    hue: 200,
    gradient: "from-sky-950/80 to-cyan-900/40",
    prompt: "Compose a 72 BPM restorative piece using fingerstyle acoustic guitar. Focus: releasing tension and pressure. Start sparse and minimal, slowly layer gentle warmth. Open voicings that feel like exhaling. Gradual tension release toward grounding.",
    reflectionPrompt: "What part of today was heaviest? Does it feel lighter now?",
  },
  {
    id: "lift-mood", label: "Lift my mood", subtitle: "Find warmth in the quiet",
    icon: "☀️", issue: "depression", instrument: "piano", tempo: 85, breathDuration: 60,
    hue: 310,
    gradient: "from-fuchsia-950/80 to-rose-900/40",
    prompt: "Compose an 85 BPM gently uplifting piece using warm piano with hopeful melodic cues. Focus: elevating low mood with patience. Start quiet, build warmth gradually. Use major key resolutions and gentle forward momentum. End with a sense of possibility.",
    reflectionPrompt: "What's one small thing you're looking forward to?",
  },
  {
    id: "find-focus", label: "Find my focus", subtitle: "Clear the noise, enter flow",
    icon: "🎯", issue: "stress", instrument: "synth", tempo: 100, breathDuration: 60,
    hue: 190,
    gradient: "from-teal-950/80 to-emerald-900/40",
    prompt: "Compose a 100 BPM focus piece using ambient synthesizer with steady rhythmic pulses and layered textures. Focus: inducing flow state. Consistent tempo, building momentum, minimal melodic distraction. Lo-fi ambient feel.",
    reflectionPrompt: "What's the one thing you want to focus on right now?",
  },
];

// ── Step types ─────────────────────────────────────────────────────────────

type Step = "choose" | "breathe" | "reveal" | "listen" | "reflect" | "summary";

// ── Feature D: Music-ready reveal screen ──────────────────────────────────
// 2-second animated moment between breathe → listen.

function MusicReveal({ theme, onDone }: { theme: SessionTheme; onDone: () => void }) {
  const orbColor = `hsl(${theme.hue}, 75%, 65%)`;

  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center"
      style={{
        background: `radial-gradient(ellipse 80% 70% at 50% 50%, hsl(${theme.hue}, 40%, 8%) 0%, hsl(0 0% 4%) 70%)`,
        animation: "reveal-fade 0.5s ease forwards",
      }}
    >
      <style>{`
        @keyframes reveal-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes reveal-ring {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes reveal-text {
          0%   { opacity: 0; transform: translateY(12px) scale(0.95); }
          40%  { opacity: 1; transform: translateY(0) scale(1); }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes reveal-icon {
          0%   { opacity: 0; transform: scale(0.5); }
          50%  { opacity: 1; transform: scale(1.1); }
          80%  { transform: scale(1); }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Expanding rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 160 + i * 60,
            height: 160 + i * 60,
            borderColor: `${orbColor}`,
            opacity: 0,
            animation: `reveal-ring 2.4s ${i * 0.25}s ease-out forwards`,
          }}
        />
      ))}

      {/* Icon */}
      <div
        style={{
          fontSize: 52,
          animation: "reveal-icon 2.4s ease forwards",
          marginBottom: 20,
          filter: `drop-shadow(0 0 24px ${orbColor})`,
        }}
      >
        {theme.icon}
      </div>

      {/* Text */}
      <div
        style={{ animation: "reveal-text 2.4s ease forwards", textAlign: "center" }}
      >
        <p
          className="text-2xl font-bold text-white"
          style={{ textShadow: `0 0 30px ${orbColor}` }}
        >
          Your music is ready
        </p>
        <p className="text-sm text-white/40 mt-2">{theme.label}</p>
      </div>
    </div>
  );
}

// ── Pulsing visualizer rings (listen step) ─────────────────────────────────

function VisualizerRings({ hue }: { hue: number }) {
  const orbColor = `hsl(${hue}, 75%, 62%)`;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <style>{`
        @keyframes ring-pulse-1 { 0%, 100% { transform: scale(1);    opacity: 0.18; } 50% { transform: scale(1.08); opacity: 0.32; } }
        @keyframes ring-pulse-2 { 0%, 100% { transform: scale(1);    opacity: 0.12; } 50% { transform: scale(1.12); opacity: 0.22; } }
        @keyframes ring-pulse-3 { 0%, 100% { transform: scale(1),    opacity: 0.07; } 50% { transform: scale(1.16); opacity: 0.14; } }
        @keyframes core-glow    { 0%, 100% { box-shadow: 0 0 40px 12px ${orbColor}33; } 50% { box-shadow: 0 0 60px 20px ${orbColor}55; } }
      `}</style>

      {/* Outer ambient rings */}
      {[{ size: 200, anim: "ring-pulse-3", dur: "4.2s" }, { size: 162, anim: "ring-pulse-2", dur: "3.6s" }, { size: 130, anim: "ring-pulse-1", dur: "3s" }].map(({ size, anim, dur }) => (
        <div
          key={size}
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size,
            borderColor: orbColor,
            animation: `${anim} ${dur} ease-in-out infinite`,
          }}
        />
      ))}

      {/* Core glow orb */}
      <div
        className="rounded-full"
        style={{
          width: 70,
          height: 70,
          background: `radial-gradient(circle, ${orbColor}44 0%, ${orbColor}11 65%, transparent 100%)`,
          animation: "core-glow 3s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ── Step progress indicator ────────────────────────────────────────────────

const STEP_ORDER: Step[] = ["choose", "breathe", "listen", "reflect", "summary"];
const STEP_LABELS: Record<Step, string> = {
  choose: "Choose", breathe: "Breathe", reveal: "Breathe", listen: "Listen", reflect: "Reflect", summary: "Summary",
};

function StepIndicator({ current }: { current: Step }) {
  const display = current === "reveal" ? "breathe" : current;
  const currentIdx = STEP_ORDER.indexOf(display as Step);
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEP_ORDER.map((s, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-500 ${
              active  ? "w-7 h-7 bg-primary text-primary-foreground shadow-lg shadow-primary/40" :
              done    ? "w-5 h-5 bg-primary/40 text-primary-foreground/70" :
                        "w-5 h-5 bg-muted text-muted-foreground"
            }`}>
              {done ? "✓" : i + 1}
            </div>
            {active && <span className="text-[10px] font-semibold text-primary uppercase tracking-widest ml-0.5">{STEP_LABELS[s]}</span>}
            {i < STEP_ORDER.length - 1 && (
              <div className={`h-px transition-all duration-500 ${done ? "w-6 bg-primary/40" : "w-4 bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Mood emoji bar ─────────────────────────────────────────────────────────

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];

function MoodBar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3 justify-center">
      {MOOD_EMOJIS.map((emoji, i) => {
        const v = i + 1;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`text-3xl transition-all duration-200 rounded-full p-1 ${
              value === v ? "scale-125 drop-shadow-lg" : "opacity-40 hover:opacity-70 hover:scale-110"
            }`}
            aria-label={`Mood ${v}`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Guided() {
  const { toast } = useToast();

  const [step, setStep]               = useState<Step>("choose");
  const [theme, setTheme]             = useState<SessionTheme | null>(null);
  const [moodBefore, setMoodBefore]   = useState(3);
  const [moodAfter, setMoodAfter]     = useState(3);
  const [reflection, setReflection]   = useState("");
  const [trackUrl, setTrackUrl]       = useState<string | null>(null);
  const [generating, setGenerating]   = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(0);
  const [musicReady, setMusicReady]   = useState(false);
  const [showSurvey, setShowSurvey]   = useState(false);

  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── When we enter breathe step ──────────────────────────────────────────
  useEffect(() => {
    if (step !== "breathe" || !theme) return;

    setBreathSecondsLeft(theme.breathDuration);
    setMusicReady(false);

    kickOffMusicGeneration();

    breathTimerRef.current = setInterval(() => {
      setBreathSecondsLeft(prev => {
        if (prev <= 1) {
          if (breathTimerRef.current) clearInterval(breathTimerRef.current);
          setStep("reveal");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (breathTimerRef.current) clearInterval(breathTimerRef.current); };
  }, [step, theme?.id]);

  const kickOffMusicGeneration = async () => {
    if (!theme) return;
    setGenerating(true);
    setGenProgress(0);
    try {
      const url = await generateMusic(
        { prompt: theme.prompt, instrument: theme.instrument, tempo: theme.tempo },
        (_s, pct) => setGenProgress(pct),
      );
      setTrackUrl(url);
      setMusicReady(true);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setStep("choose");
    } finally {
      setGenerating(false);
    }
  };

  const skipBreathing = () => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    setStep("reveal");
  };

  const handleReset = () => {
    setStep("choose");
    setTheme(null);
    setTrackUrl(null);
    setReflection("");
    setMoodBefore(3);
    setMoodAfter(3);
    setGenProgress(0);
    setGenerating(false);
    setMusicReady(false);
    setShowSurvey(false);
  };

  // ── Step 1: Choose ─────────────────────────────────────────────────────────
  if (step === "choose") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <StepIndicator current="choose" />

        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Guided Session</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            A complete experience — breathing, personalized AI music, and reflection. Choose what you need right now.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTheme(t)}
              data-testid={`theme-${t.id}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`relative text-left p-5 rounded-xl border overflow-hidden transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group animate-fade-in-up ${
                theme?.id === t.id
                  ? "border-primary ring-1 ring-primary shadow-lg shadow-primary/20"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-${theme?.id === t.id ? "100" : "0 group-hover:opacity-60"} transition-opacity duration-300`} />
              <div className="relative z-10">
                <span className="text-3xl mb-3 block">{t.icon}</span>
                <h3 className="font-semibold text-foreground">{t.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-muted-foreground/60">{t.instrument} · {t.tempo} BPM</span>
                  <span className="text-[11px] text-muted-foreground/40">·</span>
                  <span className="text-[11px] text-muted-foreground/60">
                    🫁 {Math.floor(t.breathDuration / 60)}
                    {t.breathDuration % 60 > 0 ? `:${String(t.breathDuration % 60).padStart(2, "0")}` : ""} min breathing
                  </span>
                </div>
              </div>
              {theme?.id === t.id && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <ChevronRight className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {theme && (
          <div className="space-y-6 animate-fade-in-up max-w-md mx-auto">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground text-center">How are you feeling right now?</p>
              <MoodBar value={moodBefore} onChange={setMoodBefore} />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => setStep("breathe")}
                className="gap-2 rounded-full font-bold px-8"
                size="lg"
                data-testid="button-begin-session"
              >
                <Wind className="h-4 w-4" /> Begin Session <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Music generation starts automatically when breathing begins
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Breathe (full-screen immersive) ────────────────────────────────
  if (step === "breathe" && theme) {
    const minutes = Math.floor(breathSecondsLeft / 60);
    const seconds = breathSecondsLeft % 60;
    const timeStr = minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`;

    return (
      <>
        <BreathingExercise issue={theme.issue} active={true} fullscreen={true} />

        <div className="fixed inset-x-0 bottom-0 z-20 pb-8 flex flex-col items-center gap-3 pointer-events-none">
          <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-xs text-white/50 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${musicReady ? "bg-emerald-400" : "bg-primary animate-pulse"}`} />
            {musicReady ? "Music ready" : `Composing… ${genProgress}%`}
          </div>
          <p className="text-white/30 text-sm tabular-nums">{timeStr} remaining</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={skipBreathing}
            className="pointer-events-auto text-white/40 hover:text-white/70 text-xs"
          >
            Skip to music →
          </Button>
        </div>
      </>
    );
  }

  // ── Feature D: Music reveal transition ─────────────────────────────────────
  if (step === "reveal" && theme) {
    return (
      <MusicReveal
        theme={theme}
        onDone={() => setStep("listen")}
      />
    );
  }

  // ── Step 3: Listen (pulsing rings) ─────────────────────────────────────────
  if (step === "listen" && theme) {
    const orbColor = `hsl(${theme.hue}, 75%, 60%)`;
    return (
      <div
        className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 40%, hsl(${theme.hue}, 50%, 8%) 0%, hsl(0 0% 5%) 70%)` }}
      >
        <StepIndicator current="listen" />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <div className="space-y-2">
            <span className="text-5xl">{theme.icon}</span>
            <h2 className="font-display text-xl font-bold text-white">{theme.label}</h2>
          </div>

          {/* Pulsing visualizer rings */}
          <VisualizerRings hue={theme.hue} />

          {generating ? (
            <div className="space-y-3 max-w-xs w-full">
              <p className="text-sm text-white/60">Composing your track…</p>
              <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${genProgress}%`, background: orbColor }}
                />
              </div>
              <p className="text-xs text-white/30 tabular-nums">{genProgress}%</p>
            </div>
          ) : trackUrl ? (
            <div className="w-full max-w-md space-y-4">
              <p className="text-sm text-white/50">Take your time. Listen fully.</p>
              <AudioPlayer
                audioUrl={trackUrl}
                trackName={`${theme.label} · ${theme.instrument} · ${theme.tempo} BPM`}
                loop
              />
              <Button
                onClick={() => setStep("reflect")}
                className="gap-2 rounded-full font-bold w-full"
                size="lg"
                data-testid="button-continue-reflect"
              >
                <PenLine className="h-4 w-4" /> Continue to Reflection
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ── Step 4: Reflect ─────────────────────────────────────────────────────────
  if (step === "reflect" && theme) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-8">
        <StepIndicator current="reflect" />

        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Reflect</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            {theme.reflectionPrompt}
          </p>
        </div>

        <Textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="Write freely — this stays in your browser only..."
          rows={5}
          className="resize-none text-base"
          data-testid="textarea-reflection"
        />

        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground text-center">How are you feeling now?</p>
          <MoodBar value={moodAfter} onChange={setMoodAfter} />
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setStep("summary")}
            className="gap-2 rounded-full font-bold px-8"
            size="lg"
            data-testid="button-see-summary"
          >
            <Sparkles className="h-4 w-4" /> See Your Summary
          </Button>
        </div>
      </div>
    );
  }

  // ── Step 5: Summary + Session Card + Feedback survey ───────────────────────
  if (step === "summary" && theme) {
    const lift = moodAfter - moodBefore;
    const liftLabel = lift > 0 ? `+${lift} better` : lift === 0 ? "Steady" : `${lift} lower`;
    const liftColor = lift > 0 ? "text-primary" : lift < 0 ? "text-destructive" : "text-muted-foreground";
    const sessionLabel = `${theme.label} · ${theme.instrument} · ${theme.tempo} BPM`;

    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-8">
        <StepIndicator current="summary" />

        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Session Complete</h2>
          <p className="text-sm text-muted-foreground">
            {lift > 0
              ? "You gave yourself a few minutes. That matters."
              : lift === 0
              ? "Sometimes staying steady is exactly what you need."
              : "It's okay if it didn't lift everything. You showed up."}
          </p>
        </div>

        {/* Mood shift visual */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center space-y-1">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Before</p>
              <p className="text-3xl">{MOOD_EMOJIS[moodBefore - 1]}</p>
              <p className="font-semibold text-foreground">{moodBefore}/5</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`text-lg font-bold ${liftColor}`}>{liftLabel}</div>
              <div className="h-px w-16 bg-border" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">After</p>
              <p className="text-3xl">{MOOD_EMOJIS[moodAfter - 1]}</p>
              <p className="font-semibold text-foreground">{moodAfter}/5</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Session</span>
              <span className="font-medium text-foreground">{theme.icon} {theme.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Music</span>
              <span className="text-foreground">{theme.instrument} · {theme.tempo} BPM</span>
            </div>
          </div>

          {reflection.trim() && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Your reflection</p>
              <p className="text-sm text-foreground leading-relaxed italic">"{reflection.trim()}"</p>
            </div>
          )}
        </div>

        {/* Session summary card — saveable PNG */}
        <div className="rounded-xl border border-border bg-card/60 p-5">
          <SessionSummaryCard
            sessionName={theme.label}
            icon={theme.icon}
            instrument={theme.instrument}
            tempo={theme.tempo}
            hue={theme.hue}
            moodBefore={moodBefore}
            moodAfter={moodAfter}
          />
        </div>

        {/* Feedback survey */}
        {!showSurvey ? (
          <div className="rounded-xl border border-border bg-card/60 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Help improve this app</p>
              <p className="text-xs text-muted-foreground mt-0.5">30 seconds · anonymous · reaches the developer directly</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full flex-shrink-0"
              onClick={() => setShowSurvey(true)}
            >
              <MessageSquare className="h-4 w-4" /> Give Feedback
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-primary/20 bg-card p-5">
            <FeedbackSurvey
              sessionName={sessionLabel}
              onClose={() => setShowSurvey(false)}
            />
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2 rounded-full"
            data-testid="button-new-session"
          >
            <RefreshCw className="h-4 w-4" /> Start a New Session
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
