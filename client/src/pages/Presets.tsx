import { useState } from "react";
import { generateMusic } from "@/services/lyria";
import { AudioPlayer } from "@/components/AudioPlayer";
import { BreathingExercise } from "@/components/BreathingExercise";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music, ArrowLeft, Sparkles } from "lucide-react";
import type { Issue, Instrument } from "@/lib/promptBuilder";

// ── Preset definitions ────────────────────────────────────────────────────────

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  issue: Issue;
  instrument: Instrument;
  tempo: number;
  prompt: string;
}

const PRESETS: Preset[] = [
  // Sleep
  {
    id: "cant-sleep", name: "3am and can't sleep", icon: "🌙",
    description: "When your mind won't quiet down at night",
    category: "Sleep", issue: "sleep", instrument: "piano", tempo: 60,
    prompt: "Compose a 60 BPM therapeutic lullaby using warm resonant piano with very slow arpeggios and soft sustain. Focus: guiding a restless mind toward sleep. Use extremely gentle dynamics, long held tones, and descending melodic phrases that invite drowsiness. No percussion, no sudden changes.",
  },
  {
    id: "racing-thoughts-bed", name: "Racing thoughts at bedtime", icon: "💭",
    description: "Overthinking keeping you awake",
    category: "Sleep", issue: "sleep", instrument: "synth", tempo: 55,
    prompt: "Compose a 55 BPM ambient piece using lush synthesizer pads with evolving textures and soft pulses. Focus: slowing racing thoughts for sleep. Use very slow harmonic movement, continuous drone-like layers, and almost imperceptible transitions. Conclude with silence-approaching stillness.",
  },
  // Anxiety
  {
    id: "panic-moment", name: "Panic in the moment", icon: "🫁",
    description: "Acute anxiety or a panic episode right now",
    category: "Anxiety", issue: "anxiety", instrument: "flute", tempo: 65,
    prompt: "Compose a 65 BPM calming piece using airy flute melodies with flowing phrases. Focus: calming acute panic and hyperarousal. Start with simple, predictable patterns to anchor attention, then slowly introduce warmth. Very spacious, lots of silence between phrases. Encourage deep breathing.",
  },
  {
    id: "social-anxiety", name: "About to walk into a room", icon: "🚪",
    description: "Social anxiety before an event or meeting",
    category: "Anxiety", issue: "anxiety", instrument: "guitar", tempo: 80,
    prompt: "Compose an 80 BPM grounding piece using fingerstyle acoustic guitar with mellow voicings. Focus: easing social anxiety and building gentle confidence. Start warm and steady, build subtly toward a more open, inviting feel. Natural resonance, no harsh articulation.",
  },
  {
    id: "general-worry", name: "Can't stop worrying", icon: "😰",
    description: "Persistent worry that won't let go",
    category: "Anxiety", issue: "anxiety", instrument: "piano", tempo: 70,
    prompt: "Compose a 70 BPM therapeutic piece using warm piano with gentle arpeggios. Focus: soothing chronic worry and rumination. Use repeating, predictable harmonic patterns that create a sense of safety. Slowly introduce subtle variations. Conclude with resolution and calm.",
  },
  // Stress
  {
    id: "exam-stress", name: "Exam in 2 hours", icon: "📝",
    description: "Pre-test anxiety and overwhelm",
    category: "Stress", issue: "stress", instrument: "piano", tempo: 90,
    prompt: "Compose a 90 BPM focus-enhancing piece using warm piano with steady rhythmic patterns. Focus: calming exam anxiety while maintaining alertness. Use clear, structured melodies that create a sense of competence and flow. Balanced dynamics, gently uplifting resolution.",
  },
  {
    id: "work-burnout", name: "Burned out from work", icon: "🔥",
    description: "Exhausted, overwhelmed, need to decompress",
    category: "Stress", issue: "stress", instrument: "guitar", tempo: 70,
    prompt: "Compose a 70 BPM restorative piece using fingerstyle acoustic guitar. Focus: releasing workplace burnout and tension. Start minimal and sparse, giving space to breathe. Slowly layer in gentle warmth. Use natural resonance and open voicings that feel like exhaling.",
  },
  {
    id: "overwhelmed", name: "Everything is too much", icon: "🌊",
    description: "Sensory or emotional overwhelm",
    category: "Stress", issue: "stress", instrument: "synth", tempo: 60,
    prompt: "Compose a 60 BPM ambient piece using synthesizer with lush pads and soft pulses. Focus: reducing overwhelm and sensory overload. Use extremely minimal melodic content, long sustained tones, and very slow evolution. Create a cocoon of sound that feels safe and contained.",
  },
  // Focus
  {
    id: "need-to-focus", name: "Need to lock in", icon: "🎯",
    description: "Can't concentrate, need flow state",
    category: "Focus", issue: "stress", instrument: "synth", tempo: 110,
    prompt: "Compose a 110 BPM focus-driving piece using ambient synthesizer with steady rhythmic pulses. Focus: inducing a flow state for deep work. Use consistent tempo, layered textures that build momentum, and avoid melodic distraction. Think lo-fi study beats meets ambient.",
  },
  {
    id: "creative-block", name: "Creative block", icon: "🎨",
    description: "Stuck and need inspiration to flow",
    category: "Focus", issue: "stress", instrument: "piano", tempo: 95,
    prompt: "Compose a 95 BPM inspiring piece using expressive piano with gentle melodic surprises. Focus: unlocking creative flow. Use unexpected but pleasant harmonic shifts, playful rhythmic variation, and a sense of curiosity. Build toward an open, expansive feeling.",
  },
  // Mood
  {
    id: "feeling-lonely", name: "Feeling lonely tonight", icon: "🌧",
    description: "Loneliness and disconnection",
    category: "Mood", issue: "depression", instrument: "violin", tempo: 70,
    prompt: "Compose a 70 BPM emotional piece using expressive violin with smooth legato phrasing. Focus: acknowledging loneliness without deepening it. Start with a single voice that feels seen, then gradually introduce warmth and harmonic companionship. Build toward gentle hope.",
  },
  {
    id: "bad-news", name: "Just got bad news", icon: "📱",
    description: "Processing a shock or disappointment",
    category: "Mood", issue: "depression", instrument: "piano", tempo: 65,
    prompt: "Compose a 65 BPM gentle piece using warm piano. Focus: holding space for grief or shock without judgment. Use slow, deliberate phrasing with space between notes. Allow dissonance to resolve naturally. No forced optimism — meet the listener where they are, then slowly guide toward acceptance.",
  },
  {
    id: "low-motivation", name: "Can't get off the couch", icon: "🛋",
    description: "Zero motivation, everything feels flat",
    category: "Mood", issue: "depression", instrument: "guitar", tempo: 85,
    prompt: "Compose an 85 BPM gently uplifting piece using acoustic guitar with warm fingerpicking. Focus: subtly energizing without demanding effort. Start extremely simple and approachable, then build momentum with rhythmic confidence. End with a sense of possibility.",
  },
  // Relationships
  {
    id: "after-argument", name: "After an argument", icon: "💔",
    description: "Tension, hurt, need to process",
    category: "Relationships", issue: "relationship", instrument: "piano", tempo: 70,
    prompt: "Compose a 70 BPM reflective piece using warm piano. Focus: processing interpersonal hurt and tension. Use two-voice counterpoint that starts dissonant and gradually finds harmony. Represent the journey from conflict toward understanding. Gentle, not forced resolution.",
  },
  {
    id: "miss-someone", name: "Missing someone", icon: "🕊",
    description: "Grief, distance, or nostalgia for someone",
    category: "Relationships", issue: "relationship", instrument: "violin", tempo: 65,
    prompt: "Compose a 65 BPM bittersweet piece using expressive violin with subtle vibrato. Focus: holding the ache of missing someone. Use a memorable melodic theme that returns like a memory. Warm but not artificially cheerful. End with quiet peace and acceptance.",
  },
  {
    id: "need-comfort", name: "Just need a hug", icon: "🤗",
    description: "Craving warmth and comfort",
    category: "Mood", issue: "depression", instrument: "piano", tempo: 72,
    prompt: "Compose a 72 BPM deeply comforting piece using warm resonant piano with rich harmonics. Focus: providing the musical equivalent of a warm embrace. Use close-voiced chords, gentle bass movement, and a sense of being held. Soft, enveloping, unconditionally kind.",
  },
];

const CATEGORIES = ["Sleep", "Anxiety", "Stress", "Focus", "Mood", "Relationships"];

// ── Main ───────────────────────────────────────────────────────────────────────

// Duration options for Presets — user picks before generating
const DURATION_OPTIONS = [
  { label: "30s",  ms: 30_000,  waitLabel: "~30s wait" },
  { label: "1 min", ms: 60_000,  waitLabel: "~1 min wait" },
  { label: "90s",  ms: 90_000,  waitLabel: "~1.5 min wait" },
];
const DEFAULT_DURATION_MS = 30_000;

export default function Presets() {
  const { toast } = useToast();
  const [activePreset, setActivePreset]     = useState<Preset | null>(null);
  const [generating, setGenerating]         = useState(false);
  const [genProgress, setGenProgress]       = useState(0);
  const [trackUrl, setTrackUrl]             = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [clipDurationMs, setClipDurationMs] = useState(DEFAULT_DURATION_MS);

  const handleGenerate = async (preset: Preset, durationMs = clipDurationMs) => {
    setActivePreset(preset);
    setTrackUrl(null);
    setGenerating(true);
    setGenProgress(0);

    try {
      const url = await generateMusic(
        { prompt: preset.prompt, instrument: preset.instrument, tempo: preset.tempo, clipDurationMs: durationMs },
        (_status, pct) => setGenProgress(pct),
      );
      setTrackUrl(url);
      toast({ title: "Your track is ready" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      setActivePreset(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = () => {
    setActivePreset(null);
    setTrackUrl(null);
    setGenerating(false);
  };

  const filteredPresets = selectedCategory
    ? PRESETS.filter(p => p.category === selectedCategory)
    : PRESETS;

  // ── Player view ─────────────────────────────────────────────────────────────

  if (activePreset) {
    const selectedDuration = DURATION_OPTIONS.find(d => d.ms === clipDurationMs) ?? DURATION_OPTIONS[0];
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to presets
        </button>

        <div className="text-center space-y-3">
          <span className="text-5xl">{activePreset.icon}</span>
          <h1 className="font-display text-2xl font-bold text-foreground">{activePreset.name}</h1>
          <p className="text-muted-foreground text-sm">{activePreset.description}</p>
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full border border-border">{activePreset.instrument}</span>
            <span className="px-2 py-0.5 rounded-full border border-border">{activePreset.tempo} BPM</span>
            <span className="px-2 py-0.5 rounded-full border border-border">{activePreset.category}</span>
          </div>
        </div>

        {/* Duration picker — only shown when not generating and no track yet */}
        {!generating && !trackUrl && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">Clip length</p>
            <div className="flex justify-center gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.ms}
                  onClick={() => setClipDurationMs(opt.ms)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                    clipDurationMs === opt.ms
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                  <span className="block text-[10px] font-normal opacity-60">{opt.waitLabel}</span>
                </button>
              ))}
            </div>
            <Button onClick={() => handleGenerate(activePreset)} className="w-full gap-2 rounded-full font-bold" size="lg">
              <Sparkles className="h-4 w-4" /> Generate {selectedDuration.label} Track
            </Button>
          </div>
        )}

        {generating && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <BreathingExercise issue={activePreset.issue} active={generating} />
              <Progress value={genProgress} className="h-1" />
            </CardContent>
          </Card>
        )}

        {trackUrl && (
          <div className="space-y-4">
            <AudioPlayer audioUrl={trackUrl} trackName={`${activePreset.name} · ${activePreset.instrument} · ${activePreset.tempo} BPM`} />
            {/* Regenerate with different duration */}
            <div className="flex justify-center gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.ms}
                  onClick={() => { setTrackUrl(null); setClipDurationMs(opt.ms); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    clipDurationMs === opt.ms
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button onClick={() => handleGenerate(activePreset)} variant="outline" className="w-full gap-2 rounded-full">
              <Sparkles className="h-4 w-4" /> Generate Again
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Grid view ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-foreground">Music Presets</h1>
        <p className="text-muted-foreground text-sm">
          Therapeutic music matched to specific human moments. Pick one and listen in under a minute — no assessment needed.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !selectedCategory ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selectedCategory === cat ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset, i) => (
          <button
            key={preset.id}
            onClick={() => { setClipDurationMs(DEFAULT_DURATION_MS); setTrackUrl(null); setActivePreset(preset); }}
            disabled={generating}
            data-testid={`preset-${preset.id}`}
            style={{ animationDelay: `${i * 40}ms` }}
            className="text-left group rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 animate-fade-in-up"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{preset.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border rounded-full px-2 py-0.5">
                {preset.category}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{preset.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{preset.description}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Music className="h-3 w-3" />
              <span>{preset.instrument} · {preset.tempo} BPM</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
