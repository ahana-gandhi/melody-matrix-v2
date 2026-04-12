import { useState, useEffect, useRef } from "react";
import { generateMusic } from "@/services/lyria";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BreathingExercise } from "@/components/BreathingExercise";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Loader2, RefreshCw, CheckCircle, Wind, Music, PenLine, Sparkles,
} from "lucide-react";
import type { Issue, Instrument } from "@/lib/promptBuilder";

// ── Session config ────────────────────────────────────────────────────────────

interface SessionTheme {
  id: string;
  label: string;
  icon: string;
  issue: Issue;
  instrument: Instrument;
  tempo: number;
  breathDuration: number; // seconds
  prompt: string;
  reflectionPrompt: string;
}

const THEMES: SessionTheme[] = [
  {
    id: "calm-anxiety", label: "Calm my anxiety", icon: "🫁",
    issue: "anxiety", instrument: "flute", tempo: 65, breathDuration: 90,
    prompt: "Compose a 65 BPM calming piece using airy flute melodies with flowing phrases. Focus: calming heightened worry and restlessness. Use spacious, soothing textures that encourage deep breathing. Evolving layers, smooth transitions, gentle resolution.",
    reflectionPrompt: "What feels different in your body right now compared to before?",
  },
  {
    id: "wind-down", label: "Wind down for sleep", icon: "🌙",
    issue: "sleep", instrument: "piano", tempo: 58, breathDuration: 120,
    prompt: "Compose a 58 BPM lullaby using warm resonant piano with very slow arpeggios. Focus: guiding toward restful sleep. Extremely gentle dynamics, descending phrases, long held tones. Conclude with near-silence.",
    reflectionPrompt: "How ready for rest do you feel now? Anything still on your mind?",
  },
  {
    id: "release-stress", label: "Release stress", icon: "⚡",
    issue: "stress", instrument: "guitar", tempo: 72, breathDuration: 90,
    prompt: "Compose a 72 BPM restorative piece using fingerstyle acoustic guitar. Focus: releasing tension and pressure. Start sparse and minimal, slowly layer gentle warmth. Open voicings that feel like exhaling. Gradual tension release toward grounding.",
    reflectionPrompt: "What part of today was heaviest? Does it feel lighter now?",
  },
  {
    id: "lift-mood", label: "Lift my mood", icon: "☀️",
    issue: "depression", instrument: "piano", tempo: 85, breathDuration: 60,
    prompt: "Compose an 85 BPM gently uplifting piece using warm piano with hopeful melodic cues. Focus: elevating low mood with patience. Start quiet, build warmth gradually. Use major key resolutions and gentle forward momentum. End with a sense of possibility.",
    reflectionPrompt: "What's one small thing you're looking forward to?",
  },
  {
    id: "find-focus", label: "Find my focus", icon: "🎯",
    issue: "stress", instrument: "synth", tempo: 100, breathDuration: 60,
    prompt: "Compose a 100 BPM focus piece using ambient synthesizer with steady rhythmic pulses and layered textures. Focus: inducing flow state. Consistent tempo, building momentum, minimal melodic distraction. Lo-fi ambient feel.",
    reflectionPrompt: "What's the one thing you want to focus on right now?",
  },
];

// ── Step types ────────────────────────────────────────────────────────────────

type Step = "choose" | "breathe" | "listen" | "reflect" | "summary";

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Guided() {
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("choose");
  const [theme, setTheme] = useState<SessionTheme | null>(null);
  const [moodBefore, setMoodBefore] = useState(3);
  const [moodAfter, setMoodAfter] = useState(3);
  const [reflection, setReflection] = useState("");
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [breathSecondsLeft, setBreathSecondsLeft] = useState(0);

  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Breathing countdown ──
  useEffect(() => {
    if (step !== "breathe" || !theme) return;
    setBreathSecondsLeft(theme.breathDuration);

    breathTimerRef.current = setInterval(() => {
      setBreathSecondsLeft(prev => {
        if (prev <= 1) {
          if (breathTimerRef.current) clearInterval(breathTimerRef.current);
          // Auto-advance to listen step
          startMusicGeneration();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (breathTimerRef.current) clearInterval(breathTimerRef.current); };
  }, [step, theme?.id]);

  const startMusicGeneration = async () => {
    if (!theme) return;
    setStep("listen");
    setGenerating(true);
    setGenProgress(0);
    try {
      const url = await generateMusic(
        { prompt: theme.prompt, instrument: theme.instrument, tempo: theme.tempo },
        (_s, pct) => setGenProgress(pct),
      );
      setTrackUrl(url);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setStep("choose");
    } finally {
      setGenerating(false);
    }
  };

  const skipBreathing = () => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    startMusicGeneration();
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
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  // Step 1: Choose theme
  if (step === "choose") {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Guided Session</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            A 5-minute experience: breathing, personalized AI music, and a moment to reflect. Choose what you need right now.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t)}
              data-testid={`theme-${t.id}`}
              className={`text-left p-5 rounded-lg border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                theme?.id === t.id
                  ? "border-primary bg-primary/8 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <span className="text-3xl mb-3 block">{t.icon}</span>
              <h3 className="font-semibold text-foreground">{t.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t.instrument} · {t.tempo} BPM · {Math.round(t.breathDuration / 60)}min breathing
              </p>
            </button>
          ))}
        </div>

        {theme && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-3">
              <label className="block text-sm font-medium text-foreground text-center">
                How's your mood right now? <span className="text-muted-foreground font-normal">(1 = low, 5 = great)</span>
              </label>
              <div className="flex items-center gap-4">
                <Slider value={[moodBefore]} min={1} max={5} step={1} onValueChange={([v]) => setMoodBefore(v)} className="flex-1" />
                <span className="text-lg font-semibold text-primary tabular-nums w-6 text-center">{moodBefore}</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => setStep("breathe")} className="gap-2 rounded-full font-bold" size="lg">
                <Wind className="h-4 w-4" /> Begin Session <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Breathing
  if (step === "breathe" && theme) {
    const minutes = Math.floor(breathSecondsLeft / 60);
    const seconds = breathSecondsLeft % 60;
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl font-bold text-foreground">Breathing</h2>
          <p className="text-sm text-muted-foreground">
            {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, "0")}` : `${seconds}s`} remaining · music will start after
          </p>
        </div>
        <BreathingExercise issue={theme.issue} active={true} />
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={skipBreathing} className="text-muted-foreground text-xs">
            Skip to music →
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Listen
  if (step === "listen" && theme) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-4xl">{theme.icon}</span>
          <h2 className="font-display text-xl font-bold text-foreground">{theme.label}</h2>
          <p className="text-sm text-muted-foreground">
            {generating ? "Composing your track..." : "Take your time. Listen fully."}
          </p>
        </div>

        {generating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 space-y-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <Progress value={genProgress} className="h-1 max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground">AI is composing your music... {genProgress}%</p>
            </CardContent>
          </Card>
        )}

        {trackUrl && (
          <>
            <AudioPlayer audioUrl={trackUrl} trackName={`${theme.label} · ${theme.instrument} · ${theme.tempo} BPM`} />
            <div className="flex justify-center pt-4">
              <Button onClick={() => setStep("reflect")} className="gap-2 rounded-full font-bold" size="lg">
                <PenLine className="h-4 w-4" /> Continue to Reflection
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Step 4: Reflect
  if (step === "reflect" && theme) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <PenLine className="h-8 w-8 text-primary mx-auto" />
          <h2 className="font-display text-xl font-bold text-foreground">Reflect</h2>
          <p className="text-sm text-muted-foreground">{theme.reflectionPrompt}</p>
        </div>

        <Textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="Write freely — this stays in your browser only..."
          rows={4}
          className="resize-none text-base"
          data-testid="textarea-reflection"
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground text-center">
            How's your mood now?
          </label>
          <div className="flex items-center gap-4 max-w-xs mx-auto">
            <Slider value={[moodAfter]} min={1} max={5} step={1} onValueChange={([v]) => setMoodAfter(v)} className="flex-1" />
            <span className="text-lg font-semibold text-primary tabular-nums w-6 text-center">{moodAfter}</span>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => setStep("summary")} className="gap-2 rounded-full font-bold" size="lg">
            <Sparkles className="h-4 w-4" /> See Summary
          </Button>
        </div>
      </div>
    );
  }

  // Step 5: Summary
  if (step === "summary" && theme) {
    const lift = moodAfter - moodBefore;
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="font-display text-2xl font-bold text-foreground">Session Complete</h2>
        </div>

        <Card className="border-border">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Session</span>
              <span className="font-semibold text-foreground">{theme.icon} {theme.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Music</span>
              <span className="text-foreground">{theme.instrument} · {theme.tempo} BPM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mood before</span>
              <span className="font-bold text-foreground text-lg">{moodBefore}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mood after</span>
              <span className="font-bold text-foreground text-lg">{moodAfter}/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Change</span>
              <span className={`font-bold text-lg ${lift > 0 ? "text-primary" : lift < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {lift > 0 ? `+${lift}` : lift === 0 ? "—" : lift}
              </span>
            </div>
            {reflection.trim() && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Your reflection</p>
                <p className="text-sm text-foreground leading-relaxed italic">"{reflection.trim()}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline" className="gap-2 rounded-full">
            <RefreshCw className="h-4 w-4" /> Start a New Session
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
